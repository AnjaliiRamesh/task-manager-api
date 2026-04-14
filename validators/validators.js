const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const taskSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Title is required',
  }),
  description: Joi.string().optional().allow(''),
  dueDate: Joi.date().iso().optional().messages({
    'date.format': 'Due date must be a valid ISO date (YYYY-MM-DD)',
  }),
  status: Joi.string().valid('pending', 'completed').optional().messages({
    'any.only': 'Status must be either pending or completed',
  }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  dueDate: Joi.date().iso().optional().messages({
    'date.format': 'Due date must be a valid ISO date (YYYY-MM-DD)',
  }),
  status: Joi.string().valid('pending', 'completed').optional().messages({
    'any.only': 'Status must be either pending or completed',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  taskSchema,
  updateTaskSchema,
};