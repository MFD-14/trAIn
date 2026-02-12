const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { validate, schemas } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: {
          message: 'User with this email already exists',
          status: 400
        }
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const result = await db.query(
      `INSERT INTO users (
        id, email, password, first_name, last_name, role, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
      RETURNING id, email, first_name, last_name, role, created_at`,
      [userId, email.toLowerCase(), hashedPassword, firstName, lastName, role]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        message: 'Error registering user',
        status: 500
      }
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await db.query(
      `SELECT id, email, password, first_name, last_name, role, accuracy_rating, 
       total_earnings, tasks_completed FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          status: 401
        }
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          status: 401
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        accuracyRating: user.accuracy_rating,
        totalEarnings: parseFloat(user.total_earnings),
        tasksCompleted: user.tasks_completed
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        message: 'Error logging in',
        status: 500
      }
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, accuracy_rating, 
       total_earnings, tasks_completed, pending_earnings, created_at, last_login 
       FROM users WHERE id = $1`,
      [req.user.id]
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
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        accuracyRating: user.accuracy_rating,
        totalEarnings: parseFloat(user.total_earnings),
        tasksCompleted: user.tasks_completed,
        pendingEarnings: parseFloat(user.pending_earnings),
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        message: 'Error fetching user profile',
        status: 500
      }
    });
  }
});

module.exports = router;
