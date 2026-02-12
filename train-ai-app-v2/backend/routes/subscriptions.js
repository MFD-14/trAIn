const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { getMonetizationSettings } = require('../middleware/monetization');

// GET all available plans (public - filtered by active strategies)
router.get('/plans', async (req, res) => {
  try {
    const settings  = await getMonetizationSettings();
    const { type = 'all' } = req.query;

    let query = 'SELECT * FROM subscription_plans WHERE is_active = TRUE';
    const params = [];

    if (type !== 'all') {
      query += ' AND plan_type = $1';
      params.push(type);
    }
    query += ' ORDER BY plan_type, price_monthly';

    const result = await db.query(query, params);

    // Filter based on enabled strategies
    const plans = result.rows.filter(plan => {
      if (plan.plan_type === 'company') {
        return settings['company_subscriptions']?.enabled !== false;
      }
      if (plan.plan_type === 'trainer') {
        return settings['premium_trainers']?.enabled !== false || plan.price_monthly === 0;
      }
      return true;
    });

    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch plans' } });
  }
});

// GET user's current subscription
router.get('/my-subscription', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT us.*, sp.name AS plan_name, sp.plan_type, sp.price_monthly,
              sp.features, sp.limits
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status = 'active'`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null, plan: 'Free' });
    }

    res.json({ subscription: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch subscription' } });
  }
});

// POST subscribe to a plan
router.post('/subscribe', authMiddleware, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { planId } = req.body;
    const userId = req.user.id;

    const plan = await client.query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = TRUE',
      [planId]
    );

    if (plan.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: { message: 'Plan not found' } });
    }

    // Cancel existing subscription
    await client.query(
      `UPDATE user_subscriptions
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    // Create new subscription
    const subId = uuidv4();
    const periodStart = new Date();
    const periodEnd   = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const result = await client.query(
      `INSERT INTO user_subscriptions
         (id, user_id, plan_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, 'active', $4, $5)
       RETURNING *`,
      [subId, userId, planId, periodStart, periodEnd]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: `Successfully subscribed to ${plan.rows[0].name}`,
      subscription: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: { message: 'Failed to create subscription' } });
  } finally {
    client.release();
  }
});

// DELETE cancel subscription
router.delete('/cancel', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE user_subscriptions
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE user_id = $1 AND status = 'active'
       RETURNING *`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'No active subscription found' } });
    }

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to cancel subscription' } });
  }
});

module.exports = router;
