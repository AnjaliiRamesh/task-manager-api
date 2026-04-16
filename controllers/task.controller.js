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

    // Update fields manually
    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.category !== undefined) task.category = req.body.category;
    if (req.body.tags !== undefined) task.tags = req.body.tags;

    // Save the updated task
    await task.save();

    // If due date changed - reschedule reminder
    if (req.body.dueDate !== undefined) {
      await scheduleReminder(task);
    }

    // If task is completed
    if (req.body.status === 'completed') {
      // Cancel reminder if task has due date
      if (task.dueDate) {
        cancelReminder(task._id.toString());
      }

      // Send webhook notification
      await sendWebhook({
        event: 'TASK_COMPLETED',
        taskId: task._id.toString(),
        title: task.title,
        completionDate: new Date().toISOString(),
        userId: task.userId,
        category: task.category || null,
        tags: task.tags || [],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
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

    // Cancel any scheduled reminder if task has due date
    if (task.dueDate) {
      cancelReminder(task._id.toString());
    }

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