const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * @route   GET /api/payments/balance
 * @desc    Get user's earnings balance
 * @access  Private
 */
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        total_earnings, 
        pending_earnings, 
        (total_earnings - pending_earnings) as available_balance
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    const balance = result.rows[0];

    res.json({
      balance: {
        totalEarnings: parseFloat(balance.total_earnings),
        pendingEarnings: parseFloat(balance.pending_earnings),
        availableBalance: parseFloat(balance.available_balance)
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching balance',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/payments/history
 * @desc    Get payment transaction history
 * @access  Private
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        id, transaction_type, amount, status, description,
        stripe_transaction_id, created_at, processed_at
       FROM payments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [userId]
    );

    res.json({
      transactions: result.rows.map(txn => ({
        id: txn.id,
        type: txn.transaction_type,
        amount: parseFloat(txn.amount),
        status: txn.status,
        description: txn.description,
        createdAt: txn.created_at,
        processedAt: txn.processed_at
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching payment history',
        status: 500
      }
    });
  }
});

/**
 * @route   POST /api/payments/withdraw
 * @desc    Request withdrawal of available balance
 * @access  Private
 */
router.post('/withdraw', authMiddleware, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const userId = req.user.id;
    const { amount, paymentMethod } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          message: 'Invalid withdrawal amount',
          status: 400
        }
      });
    }

    // Get user's available balance
    const userResult = await client.query(
      `SELECT 
        (total_earnings - pending_earnings) as available_balance,
        email
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    const availableBalance = parseFloat(userResult.rows[0].available_balance);

    // Check if user has sufficient balance
    if (amount > availableBalance) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          message: `Insufficient balance. Available: $${availableBalance.toFixed(2)}`,
          status: 400
        }
      });
    }

    // Minimum withdrawal amount check
    if (amount < 10) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          message: 'Minimum withdrawal amount is $10.00',
          status: 400
        }
      });
    }

    // Create payment record
    const paymentId = uuidv4();
    const paymentResult = await client.query(
      `INSERT INTO payments (
        id, user_id, transaction_type, amount, status, 
        payment_method, description, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        paymentId,
        userId,
        'withdrawal',
        amount,
        'pending',
        paymentMethod || 'stripe',
        `Withdrawal request for $${amount.toFixed(2)}`
      ]
    );

    // Update user's total earnings (deduct withdrawn amount)
    await client.query(
      'UPDATE users SET total_earnings = total_earnings - $1 WHERE id = $2',
      [amount, userId]
    );

    await client.query('COMMIT');

    // In production, you would process the actual Stripe transfer here
    // For now, we'll just create the record

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: paymentResult.rows[0].id,
        amount: parseFloat(paymentResult.rows[0].amount),
        status: paymentResult.rows[0].status,
        createdAt: paymentResult.rows[0].created_at
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Withdrawal error:', error);
    res.status(500).json({
      error: {
        message: 'Error processing withdrawal',
        status: 500
      }
    });
  } finally {
    client.release();
  }
});

/**
 * @route   GET /api/payments/earnings-breakdown
 * @desc    Get detailed earnings breakdown
 * @access  Private
 */
router.get('/earnings-breakdown', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get earnings by task type
    const taskTypeEarnings = await db.query(`
      SELECT 
        t.task_type,
        COUNT(s.id) as task_count,
        SUM(s.payment_amount) as total_earned
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.user_id = $1 AND s.status = 'approved'
      GROUP BY t.task_type
      ORDER BY total_earned DESC
    `, [userId]);

    // Get earnings by month
    const monthlyEarnings = await db.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as task_count,
        SUM(payment_amount) as total_earned
      FROM submissions
      WHERE user_id = $1 AND status = 'approved'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `, [userId]);

    res.json({
      byTaskType: taskTypeEarnings.rows.map(row => ({
        taskType: row.task_type,
        taskCount: parseInt(row.task_count),
        totalEarned: parseFloat(row.total_earned)
      })),
      byMonth: monthlyEarnings.rows.map(row => ({
        month: row.month,
        taskCount: parseInt(row.task_count),
        totalEarned: parseFloat(row.total_earned)
      }))
    });
  } catch (error) {
    console.error('Get earnings breakdown error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching earnings breakdown',
        status: 500
      }
    });
  }
});

/**
 * @route   POST /api/payments/setup-payment-method
 * @desc    Setup Stripe payment method for user
 * @access  Private
 */
router.post('/setup-payment-method', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    // Create or retrieve Stripe customer
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        userId: userId
      }
    });

    // Save Stripe customer ID
    await db.query(
      'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
      [customer.id, userId]
    );

    // Create setup intent for payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Setup payment method error:', error);
    res.status(500).json({
      error: {
        message: 'Error setting up payment method',
        status: 500
      }
    });
  }
});

module.exports = router;
