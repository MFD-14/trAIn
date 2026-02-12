const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          status: 400,
          details: errors
        }
      });
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('user', 'client').default('user')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createTask: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    taskType: Joi.string().valid('image_labeling', 'text_classification', 'audio_transcription', 'data_validation', 'sentiment_analysis').required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
    paymentPerTask: Joi.number().min(0.01).max(100).required(),
    estimatedTimeMinutes: Joi.number().min(1).max(120).required(),
    totalTasks: Joi.number().min(1).max(100000).required(),
    requiredAccuracy: Joi.number().min(0).max(100).default(90),
    datasetUrl: Joi.string().uri().optional(),
    instructions: Joi.string().max(5000).optional()
  }),

  submitTask: Joi.object({
    taskId: Joi.string().uuid().required(),
    resultData: Joi.object().required(),
    timeSpentSeconds: Joi.number().min(1).required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phoneNumber: Joi.string().optional(),
    preferredLanguage: Joi.string().optional(),
    skillCategories: Joi.array().items(Joi.string()).optional()
  })
};

module.exports = {
  validate,
  schemas
};
