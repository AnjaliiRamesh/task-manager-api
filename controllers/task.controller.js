const Task = require('../models/task.model');
const { taskSchema, updateTaskSchema } = require('../validators/validators');
const { scheduleReminder, cancelReminder } = require('../jobs/reminder.job');
const { sendWebhook } = require('../services/webhook.service');

// Create a new task
const createTask = async (req, res, next) => {
  try {
    const { error } = taskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { title, description, dueDate, status, category, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      dueDate,
      status,
      category: category || null,
      tags: tags || [],
      userId: req.user.id,
    });

    // Schedule reminder if due date is provided
    if (dueDate) {
      await scheduleReminder(task);
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Get all tasks for logged in user with optional filters
const getAllTasks = async (req, res, next) => {
  try {
    const { category, tags } = req.query;

    // Build filter object
    const filter = { userId: req.user.id };

    if (category) {
      filter.category = category;
    }

    if (tags) {
      const tagsArray = tags.split(',').map((tag) => tag.trim());
      filter.tags = { $in: tagsArray };
    }

    const tasks = await Task.find(filter).populate('category', 'name description');

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single task by ID
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      'category',
      'name description'
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This task belongs to another user.',
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// Update a task
const updateTask = async (req, res, next) => {
  try {
    const { error } = updateTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This task belongs to another user.',
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Handle reminder updates
    if (req.body.dueDate) {
      // Due date changed - reschedule reminder
      await scheduleReminder(updatedTask);
    }

    if (req.body.status === 'completed') {
      // Task completed - cancel reminder
      await cancelReminder(task._id.toString());

      // Send webhook notification
      await sendWebhook({
        event: 'TASK_COMPLETED',
        taskId: updatedTask._id.toString(),
        title: updatedTask.title,
        completionDate: new Date().toISOString(),
        userId: updatedTask.userId,
        category: updatedTask.category,
        tags: updatedTask.tags,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a task
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This task belongs to another user.',
      });
    }

    // Cancel any scheduled reminder
    await cancelReminder(task._id.toString());

    await Task.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};