const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @route   POST /api/submissions
 * @desc    Submit completed task
 * @access  Private
 */
router.post('/', authMiddleware, validate(schemas.submitTask), async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { taskId, resultData, timeSpentSeconds } = req.body;
    const userId = req.user.id;

    // Get task details
    const taskResult = await client.query(
      'SELECT * FROM tasks WHERE id = $1 AND status = $2',
      [taskId, 'active']
    );

    if (taskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          message: 'Task not found or no longer active',
          status: 404
        }
      });
    }

    const task = taskResult.rows[0];

    // Check if task is full
    if (task.completed_tasks >= task.total_tasks) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          message: 'Task has reached maximum submissions',
          status: 400
        }
      });
    }

    // Check if user has already submitted this specific task instance
    // (In a real system, you'd track individual task instances)
    const existingSubmission = await client.query(
      `SELECT id FROM submissions 
       WHERE task_id = $1 AND user_id = $2 
       AND created_at > NOW() - INTERVAL '1 hour'
       LIMIT 1`,
      [taskId, userId]
    );

    if (existingSubmission.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          message: 'You have recently submitted this task. Please wait before submitting again.',
          status: 400
        }
      });
    }

    // Create submission
    const submissionId = uuidv4();
    const submission = await client.query(
      `INSERT INTO submissions (
        id, task_id, user_id, result_data, time_spent_seconds,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
      [
        submissionId,
        taskId,
        userId,
        JSON.stringify(resultData),
        timeSpentSeconds,
        'pending_review'
      ]
    );

    // Update task completed count
    await client.query(
      'UPDATE tasks SET completed_tasks = completed_tasks + 1 WHERE id = $1',
      [taskId]
    );

    // Add pending earnings to user
    const paymentAmount = parseFloat(task.payment_per_task);
    await client.query(
      'UPDATE users SET pending_earnings = pending_earnings + $1 WHERE id = $2',
      [paymentAmount, userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Task submitted successfully',
      submission: {
        id: submission.rows[0].id,
        taskId: submission.rows[0].task_id,
        status: submission.rows[0].status,
        pendingEarnings: paymentAmount,
        createdAt: submission.rows[0].created_at
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit task error:', error);
    res.status(500).json({
      error: {
        message: 'Error submitting task',
        status: 500
      }
    });
  } finally {
    client.release();
  }
});

/**
 * @route   GET /api/submissions
 * @desc    Get user's submission history
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT 
        s.id, s.task_id, s.status, s.accuracy_score, s.payment_amount,
        s.time_spent_seconds, s.created_at, s.reviewed_at,
        t.title as task_title, t.task_type, t.payment_per_task
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    const countQuery = status 
      ? 'SELECT COUNT(*) FROM submissions WHERE user_id = $1 AND status = $2'
      : 'SELECT COUNT(*) FROM submissions WHERE user_id = $1';
    
    const countParams = status ? [userId, status] : [userId];
    const countResult = await db.query(countQuery, countParams);

    res.json({
      submissions: result.rows.map(sub => ({
        id: sub.id,
        taskId: sub.task_id,
        taskTitle: sub.task_title,
        taskType: sub.task_type,
        status: sub.status,
        accuracyScore: sub.accuracy_score,
        paymentAmount: parseFloat(sub.payment_amount || sub.payment_per_task),
        timeSpentSeconds: sub.time_spent_seconds,
        createdAt: sub.created_at,
        reviewedAt: sub.reviewed_at
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching submissions',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/submissions/:id
 * @desc    Get submission details
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        s.*, 
        t.title as task_title, 
        t.task_type,
        t.payment_per_task
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.id = $1 AND s.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Submission not found',
          status: 404
        }
      });
    }

    const submission = result.rows[0];

    res.json({
      submission: {
        id: submission.id,
        taskId: submission.task_id,
        taskTitle: submission.task_title,
        taskType: submission.task_type,
        status: submission.status,
        resultData: JSON.parse(submission.result_data),
        accuracyScore: submission.accuracy_score,
        paymentAmount: parseFloat(submission.payment_amount || submission.payment_per_task),
        timeSpentSeconds: submission.time_spent_seconds,
        feedback: submission.feedback,
        createdAt: submission.created_at,
        reviewedAt: submission.reviewed_at
      }
    });
  } catch (error) {
    console.error('Get submission details error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching submission details',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/submissions/stats/summary
 * @desc    Get user's submission statistics
 * @access  Private
 */
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get today's stats
    const todayStats = await db.query(`
      SELECT 
        COUNT(*) as tasks_today,
        SUM(payment_amount) as earnings_today,
        SUM(time_spent_seconds) as time_today,
        AVG(accuracy_score) as avg_accuracy_today
      FROM submissions
      WHERE user_id = $1 
        AND DATE(created_at) = CURRENT_DATE
        AND status IN ('approved', 'pending_review')
    `, [userId]);

    // Get this week's stats
    const weekStats = await db.query(`
      SELECT 
        COUNT(*) as tasks_week,
        SUM(payment_amount) as earnings_week
      FROM submissions
      WHERE user_id = $1 
        AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
        AND status IN ('approved', 'pending_review')
    `, [userId]);

    // Get recent activity
    const recentActivity = await db.query(`
      SELECT 
        s.id, s.payment_amount, s.created_at,
        t.title as task_title, t.task_type
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      today: {
        tasksCompleted: parseInt(todayStats.rows[0].tasks_today) || 0,
        earnings: parseFloat(todayStats.rows[0].earnings_today) || 0,
        timeSpentSeconds: parseInt(todayStats.rows[0].time_today) || 0,
        averageAccuracy: parseFloat(todayStats.rows[0].avg_accuracy_today) || 0
      },
      thisWeek: {
        tasksCompleted: parseInt(weekStats.rows[0].tasks_week) || 0,
        earnings: parseFloat(weekStats.rows[0].earnings_week) || 0
      },
      recentActivity: recentActivity.rows.map(activity => ({
        id: activity.id,
        taskTitle: activity.task_title,
        taskType: activity.task_type,
        paymentAmount: parseFloat(activity.payment_amount),
        createdAt: activity.created_at
      }))
    });
  } catch (error) {
    console.error('Get submission stats error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching submission statistics',
        status: 500
      }
    });
  }
});

module.exports = router;
