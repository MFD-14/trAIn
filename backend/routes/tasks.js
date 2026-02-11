const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @route   GET /api/tasks
 * @desc    Get available tasks (with filters)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      taskType, 
      difficulty, 
      minPayment, 
      maxPayment, 
      limit = 20, 
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        t.id, t.title, t.description, t.task_type, t.difficulty,
        t.payment_per_task, t.estimated_time_minutes, t.total_tasks,
        t.completed_tasks, t.required_accuracy, t.created_at,
        c.company_name as client_name,
        (t.total_tasks - t.completed_tasks) as remaining_tasks
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.status = 'active' 
        AND t.completed_tasks < t.total_tasks
    `;

    const params = [];
    let paramIndex = 1;

    if (taskType) {
      query += ` AND t.task_type = $${paramIndex}`;
      params.push(taskType);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND t.difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (minPayment) {
      query += ` AND t.payment_per_task >= $${paramIndex}`;
      params.push(minPayment);
      paramIndex++;
    }

    if (maxPayment) {
      query += ` AND t.payment_per_task <= $${paramIndex}`;
      params.push(maxPayment);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    const countResult = await db.query(
      'SELECT COUNT(*) FROM tasks WHERE status = $1 AND completed_tasks < total_tasks',
      ['active']
    );

    res.json({
      tasks: result.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        taskType: task.task_type,
        difficulty: task.difficulty,
        paymentPerTask: parseFloat(task.payment_per_task),
        estimatedTimeMinutes: task.estimated_time_minutes,
        totalTasks: task.total_tasks,
        completedTasks: task.completed_tasks,
        remainingTasks: task.remaining_tasks,
        requiredAccuracy: task.required_accuracy,
        clientName: task.client_name,
        createdAt: task.created_at
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching tasks',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task details
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        t.*, 
        c.company_name as client_name,
        c.rating as client_rating,
        (t.total_tasks - t.completed_tasks) as remaining_tasks
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Task not found',
          status: 404
        }
      });
    }

    const task = result.rows[0];

    // Get user's previous submissions for this task
    const userSubmissions = await db.query(
      `SELECT COUNT(*) as submission_count, AVG(accuracy_score) as avg_accuracy
       FROM submissions 
       WHERE task_id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    res.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        taskType: task.task_type,
        difficulty: task.difficulty,
        paymentPerTask: parseFloat(task.payment_per_task),
        estimatedTimeMinutes: task.estimated_time_minutes,
        totalTasks: task.total_tasks,
        completedTasks: task.completed_tasks,
        remainingTasks: task.remaining_tasks,
        requiredAccuracy: task.required_accuracy,
        instructions: task.instructions,
        datasetUrl: task.dataset_url,
        clientName: task.client_name,
        clientRating: task.client_rating,
        status: task.status,
        createdAt: task.created_at,
        userStats: {
          submissionCount: parseInt(userSubmissions.rows[0].submission_count),
          averageAccuracy: parseFloat(userSubmissions.rows[0].avg_accuracy) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get task details error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching task details',
        status: 500
      }
    });
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task (clients only)
 * @access  Private (Client role required)
 */
router.post('/', authMiddleware, requireRole('client'), validate(schemas.createTask), async (req, res) => {
  try {
    const {
      title,
      description,
      taskType,
      difficulty,
      paymentPerTask,
      estimatedTimeMinutes,
      totalTasks,
      requiredAccuracy,
      datasetUrl,
      instructions
    } = req.body;

    const taskId = uuidv4();

    const result = await db.query(
      `INSERT INTO tasks (
        id, client_id, title, description, task_type, difficulty,
        payment_per_task, estimated_time_minutes, total_tasks,
        required_accuracy, dataset_url, instructions, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *`,
      [
        taskId,
        req.user.id,
        title,
        description,
        taskType,
        difficulty,
        paymentPerTask,
        estimatedTimeMinutes,
        totalTasks,
        requiredAccuracy,
        datasetUrl,
        instructions,
        'active'
      ]
    );

    const task = result.rows[0];

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task.id,
        title: task.title,
        taskType: task.task_type,
        totalTasks: task.total_tasks,
        paymentPerTask: parseFloat(task.payment_per_task),
        status: task.status,
        createdAt: task.created_at
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      error: {
        message: 'Error creating task',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/tasks/stats/summary
 * @desc    Get task statistics
 * @access  Private
 */
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_available_tasks,
        SUM(total_tasks - completed_tasks) as total_remaining_tasks,
        AVG(payment_per_task) as avg_payment,
        COUNT(DISTINCT task_type) as task_type_count
      FROM tasks 
      WHERE status = 'active' AND completed_tasks < total_tasks
    `);

    res.json({
      stats: {
        totalAvailableTasks: parseInt(stats.rows[0].total_available_tasks),
        totalRemainingTasks: parseInt(stats.rows[0].total_remaining_tasks),
        averagePayment: parseFloat(stats.rows[0].avg_payment) || 0,
        taskTypeCount: parseInt(stats.rows[0].task_type_count)
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching task statistics',
        status: 500
      }
    });
  }
});

module.exports = router;
