const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        id, email, first_name, last_name, role, phone_number,
        accuracy_rating, total_earnings, pending_earnings, tasks_completed,
        preferred_language, skill_categories, created_at, last_login
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

    const user = result.rows[0];

    res.json({
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phoneNumber: user.phone_number,
        accuracyRating: user.accuracy_rating,
        totalEarnings: parseFloat(user.total_earnings),
        pendingEarnings: parseFloat(user.pending_earnings),
        tasksCompleted: user.tasks_completed,
        preferredLanguage: user.preferred_language,
        skillCategories: user.skill_categories,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching profile',
        status: 500
      }
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware, validate(schemas.updateProfile), async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phoneNumber, preferredLanguage, skillCategories } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (firstName) {
      updates.push(`first_name = $${paramIndex}`);
      values.push(firstName);
      paramIndex++;
    }

    if (lastName) {
      updates.push(`last_name = $${paramIndex}`);
      values.push(lastName);
      paramIndex++;
    }

    if (phoneNumber !== undefined) {
      updates.push(`phone_number = $${paramIndex}`);
      values.push(phoneNumber);
      paramIndex++;
    }

    if (preferredLanguage) {
      updates.push(`preferred_language = $${paramIndex}`);
      values.push(preferredLanguage);
      paramIndex++;
    }

    if (skillCategories) {
      updates.push(`skill_categories = $${paramIndex}`);
      values.push(skillCategories);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: {
          message: 'No updates provided',
          status: 400
        }
      });
    }

    values.push(userId);

    const result = await db.query(
      `UPDATE users 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING id, email, first_name, last_name, phone_number, 
                 preferred_language, skill_categories`,
      values
    );

    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        preferredLanguage: user.preferred_language,
        skillCategories: user.skill_categories
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        message: 'Error updating profile',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get overall stats
    const overallStats = await db.query(
      `SELECT 
        accuracy_rating, total_earnings, pending_earnings,
        tasks_completed, created_at
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    // Get task breakdown
    const taskBreakdown = await db.query(`
      SELECT 
        t.task_type,
        COUNT(s.id) as count,
        AVG(s.accuracy_score) as avg_accuracy
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.user_id = $1 AND s.status = 'approved'
      GROUP BY t.task_type
    `, [userId]);

    // Get performance trend (last 30 days)
    const performanceTrend = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as tasks_completed,
        AVG(accuracy_score) as avg_accuracy,
        SUM(payment_amount) as earnings
      FROM submissions
      WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'approved'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [userId]);

    const user = overallStats.rows[0];

    res.json({
      overall: {
        accuracyRating: user.accuracy_rating,
        totalEarnings: parseFloat(user.total_earnings),
        pendingEarnings: parseFloat(user.pending_earnings),
        tasksCompleted: user.tasks_completed,
        memberSince: user.created_at
      },
      taskBreakdown: taskBreakdown.rows.map(row => ({
        taskType: row.task_type,
        count: parseInt(row.count),
        averageAccuracy: parseFloat(row.avg_accuracy) || 0
      })),
      performanceTrend: performanceTrend.rows.map(row => ({
        date: row.date,
        tasksCompleted: parseInt(row.tasks_completed),
        averageAccuracy: parseFloat(row.avg_accuracy) || 0,
        earnings: parseFloat(row.earnings) || 0
      }))
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching user statistics',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/users/leaderboard
 * @desc    Get leaderboard (top performers)
 * @access  Private
 */
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const { period = 'all_time', limit = 10 } = req.query;
    
    let dateFilter = '';
    if (period === 'week') {
      dateFilter = `AND s.created_at >= DATE_TRUNC('week', CURRENT_DATE)`;
    } else if (period === 'month') {
      dateFilter = `AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE)`;
    }

    const result = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.accuracy_rating,
        COUNT(s.id) as tasks_completed,
        SUM(s.payment_amount) as total_earned,
        AVG(s.accuracy_score) as avg_accuracy
      FROM users u
      JOIN submissions s ON u.id = s.user_id
      WHERE s.status = 'approved' ${dateFilter}
      GROUP BY u.id, u.first_name, u.last_name, u.accuracy_rating
      ORDER BY total_earned DESC
      LIMIT $1
    `, [limit]);

    res.json({
      leaderboard: result.rows.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        name: `${user.first_name} ${user.last_name.charAt(0)}.`,
        accuracyRating: user.accuracy_rating,
        tasksCompleted: parseInt(user.tasks_completed),
        totalEarned: parseFloat(user.total_earned),
        averageAccuracy: parseFloat(user.avg_accuracy)
      })),
      period
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching leaderboard',
        status: 500
      }
    });
  }
});

module.exports = router;
