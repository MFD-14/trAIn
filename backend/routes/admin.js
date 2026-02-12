const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { invalidateCache, getMonetizationSettings } = require('../middleware/monetization');

// ─────────────────────────────────────────
// GET all monetization settings
// ─────────────────────────────────────────
router.get('/monetization', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, strategy_key, strategy_name, is_enabled, config, enabled_at, updated_at, notes
       FROM monetization_settings
       ORDER BY CASE strategy_key
         WHEN 'platform_commission'      THEN 1
         WHEN 'company_subscriptions'    THEN 2
         WHEN 'premium_trainers'         THEN 3
         WHEN 'data_quality_guarantee'   THEN 4
         WHEN 'featured_listings'        THEN 5
         WHEN 'api_access'               THEN 6
         ELSE 7
       END`
    );
    res.json({ strategies: result.rows });
  } catch (error) {
    console.error('Get monetization settings error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch monetization settings' } });
  }
});

// ─────────────────────────────────────────
// TOGGLE a strategy ON or OFF
// ─────────────────────────────────────────
router.patch('/monetization/:strategyKey/toggle', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { strategyKey } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: { message: '"enabled" must be a boolean' } });
    }

    const result = await db.query(
      `UPDATE monetization_settings
       SET is_enabled = $1,
           enabled_at = CASE WHEN $1 = TRUE THEN NOW() ELSE enabled_at END,
           updated_at = NOW()
       WHERE strategy_key = $2
       RETURNING *`,
      [enabled, strategyKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Strategy not found' } });
    }

    invalidateCache();

    res.json({
      message: `Strategy "${strategyKey}" ${enabled ? 'ENABLED' : 'DISABLED'} successfully`,
      strategy: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle monetization error:', error);
    res.status(500).json({ error: { message: 'Failed to toggle strategy' } });
  }
});

// ─────────────────────────────────────────
// UPDATE config for a strategy
// ─────────────────────────────────────────
router.patch('/monetization/:strategyKey/config', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { strategyKey } = req.params;
    const { config } = req.body;

    const result = await db.query(
      `UPDATE monetization_settings
       SET config = $1, updated_at = NOW()
       WHERE strategy_key = $2
       RETURNING *`,
      [JSON.stringify(config), strategyKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Strategy not found' } });
    }

    invalidateCache();

    res.json({
      message: `Config updated for "${strategyKey}"`,
      strategy: result.rows[0]
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: { message: 'Failed to update config' } });
  }
});

// ─────────────────────────────────────────
// GET platform revenue analytics
// ─────────────────────────────────────────
router.get('/revenue', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    // Monthly revenue summary
    const monthlyRevenue = await db.query(
      `SELECT * FROM platform_revenue_summary LIMIT 12`
    );

    // Total platform stats
    const totals = await db.query(`
      SELECT
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'user')   AS total_trainers,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'client') AS total_clients,
        COUNT(DISTINCT t.id)                                   AS total_tasks,
        COUNT(DISTINCT s.id)                                   AS total_submissions,
        COALESCE(SUM(ct.commission_amount), 0)                 AS total_commission_earned,
        COALESCE(SUM(ct.gross_volume_day), 0)                  AS total_gross_volume
      FROM users u
      LEFT JOIN tasks t ON t.client_id = u.id
      LEFT JOIN submissions s ON s.user_id = u.id
      LEFT JOIN (
        SELECT SUM(commission_amount) AS commission_amount,
               SUM(gross_amount)      AS gross_volume_day
        FROM commission_transactions
      ) ct ON TRUE
    `);

    // Active subscriptions breakdown
    const subscriptions = await db.query(`
      SELECT
        sp.name AS plan_name,
        sp.plan_type,
        sp.price_monthly,
        COUNT(us.id) AS subscriber_count,
        COUNT(us.id) * sp.price_monthly AS monthly_revenue
      FROM subscription_plans sp
      LEFT JOIN user_subscriptions us ON us.plan_id = sp.id AND us.status = 'active'
      GROUP BY sp.id, sp.name, sp.plan_type, sp.price_monthly
      ORDER BY sp.plan_type, sp.price_monthly
    `);

    // Today's stats
    const today = await db.query(`
      SELECT
        COUNT(*)                    AS submissions_today,
        COALESCE(SUM(commission_amount), 0) AS revenue_today,
        COALESCE(SUM(gross_amount),      0) AS volume_today
      FROM commission_transactions
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    res.json({
      totals: totals.rows[0],
      today: today.rows[0],
      monthlyRevenue: monthlyRevenue.rows,
      subscriptions: subscriptions.rows
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch revenue data' } });
  }
});

// ─────────────────────────────────────────
// GET all users (admin view)
// ─────────────────────────────────────────
router.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT id, email, first_name, last_name, role,
             accuracy_rating, total_earnings, tasks_completed,
             created_at, last_login
      FROM users WHERE 1=1
    `;
    const params = [];
    if (role) { query += ` AND role = $${params.length + 1}`; params.push(role); }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const count  = await db.query('SELECT COUNT(*) FROM users' + (role ? ' WHERE role = $1' : ''), role ? [role] : []);

    res.json({ users: result.rows, total: parseInt(count.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch users' } });
  }
});

// ─────────────────────────────────────────
// GET subscription plans
// ─────────────────────────────────────────
router.get('/subscription-plans', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM subscription_plans ORDER BY plan_type, price_monthly'
    );
    res.json({ plans: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch plans' } });
  }
});

module.exports = router;
