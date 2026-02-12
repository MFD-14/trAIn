const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/clients/dashboard
 * @desc    Get client dashboard overview
 * @access  Private (Client role required)
 */
router.get('/dashboard', authMiddleware, requireRole('client'), async (req, res) => {
  try {
    const clientId = req.user.id;

    // Get client's tasks summary
    const tasksSummary = await db.query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(total_tasks) as total_submissions_needed,
        SUM(completed_tasks) as total_submissions_received
      FROM tasks
      WHERE client_id = $1
    `, [clientId]);

    // Get total spending
    const spending = await db.query(`
      SELECT 
        SUM(payment_per_task * completed_tasks) as total_spent,
        SUM(payment_per_task * (total_tasks - completed_tasks)) as estimated_remaining
      FROM tasks
      WHERE client_id = $1
    `, [clientId]);

    // Get recent submissions
    const recentSubmissions = await db.query(`
      SELECT 
        s.id, s.created_at, s.status,
        t.title as task_title,
        u.first_name, u.last_name
      FROM submissions s
      JOIN tasks t ON s.task_id = t.id
      JOIN users u ON s.user_id = u.id
      WHERE t.client_id = $1
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [clientId]);

    const summary = tasksSummary.rows[0];
    const spendingData = spending.rows[0];

    res.json({
      summary: {
        totalTasks: parseInt(summary.total_tasks) || 0,
        activeTasks: parseInt(summary.active_tasks) || 0,
        completedTasks: parseInt(summary.completed_tasks) || 0,
        totalSubmissionsNeeded: parseInt(summary.total_submissions_needed) || 0,
        totalSubmissionsReceived: parseInt(summary.total_submissions_received) || 0
      },
      spending: {
        totalSpent: parseFloat(spendingData.total_spent) || 0,
        estimatedRemaining: parseFloat(spendingData.estimated_remaining) || 0
      },
      recentSubmissions: recentSubmissions.rows.map(sub => ({
        id: sub.id,
        taskTitle: sub.task_title,
        submittedBy: `${sub.first_name} ${sub.last_name}`,
        status: sub.status,
        createdAt: sub.created_at
      }))
    });
  } catch (error) {
    console.error('Get client dashboard error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching client dashboard',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/clients/tasks
 * @desc    Get all tasks created by client
 * @access  Private (Client role required)
 */
router.get('/tasks', authMiddleware, requireRole('client'), async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT 
        id, title, task_type, difficulty, status,
        payment_per_task, total_tasks, completed_tasks,
        created_at,
        (total_tasks - completed_tasks) as remaining_tasks,
        (payment_per_task * completed_tasks) as total_spent
      FROM tasks
      WHERE client_id = $1
    `;

    const params = [clientId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM tasks WHERE client_id = $1',
      [clientId]
    );

    res.json({
      tasks: result.rows.map(task => ({
        id: task.id,
        title: task.title,
        taskType: task.task_type,
        difficulty: task.difficulty,
        status: task.status,
        paymentPerTask: parseFloat(task.payment_per_task),
        totalTasks: task.total_tasks,
        completedTasks: task.completed_tasks,
        remainingTasks: task.remaining_tasks,
        totalSpent: parseFloat(task.total_spent),
        createdAt: task.created_at
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get client tasks error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching client tasks',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/clients/tasks/:taskId/submissions
 * @desc    Get all submissions for a specific task
 * @access  Private (Client role required)
 */
router.get('/tasks/:taskId/submissions', authMiddleware, requireRole('client'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const clientId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    // Verify task belongs to client
    const taskCheck = await db.query(
      'SELECT id FROM tasks WHERE id = $1 AND client_id = $2',
      [taskId, clientId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Task not found or unauthorized',
          status: 404
        }
      });
    }

    let query = `
      SELECT 
        s.id, s.status, s.accuracy_score, s.payment_amount,
        s.time_spent_seconds, s.created_at, s.reviewed_at,
        u.first_name, u.last_name, u.accuracy_rating
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.task_id = $1
    `;

    const params = [taskId];
    let paramIndex = 2;

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM submissions WHERE task_id = $1',
      [taskId]
    );

    res.json({
      submissions: result.rows.map(sub => ({
        id: sub.id,
        status: sub.status,
        accuracyScore: sub.accuracy_score,
        paymentAmount: parseFloat(sub.payment_amount),
        timeSpentSeconds: sub.time_spent_seconds,
        submittedBy: {
          name: `${sub.first_name} ${sub.last_name}`,
          accuracyRating: sub.accuracy_rating
        },
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
    console.error('Get task submissions error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching task submissions',
        status: 500
      }
    });
  }
});

/**
 * @route   PUT /api/clients/submissions/:submissionId/review
 * @desc    Review and approve/reject a submission
 * @access  Private (Client role required)
 */
router.put('/submissions/:submissionId/review', authMiddleware, requireRole('client'), async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const { submissionId } = req.params;
    const { status, accuracyScore, feedback } = req.body;
    const clientId = req.user.id;

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          message: 'Status must be either "approved" or "rejected"',
          status: 400
        }
      });
    }

    // Get submission and verify it belongs to client's task
    const submissionResult = await client.query(
      `SELECT s.*, t.payment_per_task, t.client_id
       FROM submissions s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.id = $1`,
      [submissionId]
    );

    if (submissionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          message: 'Submission not found',
          status: 404
        }
      });
    }

    const submission = submissionResult.rows[0];

    if (submission.client_id !== clientId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: {
          message: 'Unauthorized to review this submission',
          status: 403
        }
      });
    }

    // Update submission
    const paymentAmount = status === 'approved' ? parseFloat(submission.payment_per_task) : 0;
    
    await client.query(
      `UPDATE submissions 
       SET status = $1, accuracy_score = $2, feedback = $3, 
           payment_amount = $4, reviewed_at = NOW()
       WHERE id = $5`,
      [status, accuracyScore, feedback, paymentAmount, submissionId]
    );

    // If approved, update user's earnings and stats
    if (status === 'approved') {
      await client.query(
        `UPDATE users 
         SET total_earnings = total_earnings + $1,
             pending_earnings = pending_earnings - $1,
             tasks_completed = tasks_completed + 1,
             accuracy_rating = (
               (accuracy_rating * tasks_completed + $2) / (tasks_completed + 1)
             )
         WHERE id = $3`,
        [paymentAmount, accuracyScore || 0, submission.user_id]
      );
    } else {
      // If rejected, remove from pending earnings
      await client.query(
        'UPDATE users SET pending_earnings = pending_earnings - $1 WHERE id = $2',
        [paymentAmount, submission.user_id]
      );
    }

    await client.query('COMMIT');

    res.json({
      message: `Submission ${status} successfully`,
      submission: {
        id: submissionId,
        status,
        accuracyScore,
        paymentAmount,
        reviewedAt: new Date()
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Review submission error:', error);
    res.status(500).json({
      error: {
        message: 'Error reviewing submission',
        status: 500
      }
    });
  } finally {
    client.release();
  }
});

module.exports = router;
