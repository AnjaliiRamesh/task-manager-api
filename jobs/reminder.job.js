const axios = require('axios');
const { addReminder, removeReminder } = require('../config/agenda');
require('dotenv').config();

// Schedule a reminder for a task
const scheduleReminder = async (task) => {
  if (!task.dueDate) return;

  const dueDate = new Date(task.dueDate);
  const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
  const now = new Date();
  const timeUntilReminder = reminderTime.getTime() - now.getTime();

  // Cancel any existing reminder for this task
  cancelReminder(task._id.toString());

  // Only schedule if reminder time is in the future
  if (timeUntilReminder <= 0) {
    console.log(`⚠️ Reminder time has already passed for task: ${task.title}`);
    return;
  }

  console.log(`✅ Reminder scheduled for task "${task.title}" at ${reminderTime}`);
  console.log(`⏰ Time until reminder: ${Math.round(timeUntilReminder / 1000 / 60)} minutes`);

  // Schedule the reminder using setTimeout
  const timeoutRef = setTimeout(async () => {
    await fireReminder(task);
    // Clean up after firing
    removeReminder(task._id.toString());
  }, timeUntilReminder);

  // Save the timeout reference
  addReminder(task._id.toString(), timeoutRef);
};

// Cancel a reminder for a task
const cancelReminder = (taskId) => {
  const removed = removeReminder(taskId.toString());
  if (removed) {
    console.log(`✅ Cancelled existing reminder for task ${taskId}`);
  }
};

// Fire the actual reminder notification
const fireReminder = async (task) => {
  console.log('==========================================');
  console.log('🔔 TASK REMINDER NOTIFICATION');
  console.log('==========================================');
  console.log(`Task ID    : ${task._id}`);
  console.log(`Task Title : ${task.title}`);
  console.log(`User ID    : ${task.userId}`);
  console.log(`Due Date   : ${task.dueDate}`);
  console.log(`Fired At   : ${new Date().toISOString()}`);
  console.log('==========================================');

  // Send to webhook
  try {
    await axios.post(process.env.WEBHOOK_URL, {
      event: 'TASK_REMINDER',
      taskId: task._id.toString(),
      taskTitle: task.title,
      userId: task.userId,
      dueDate: task.dueDate,
      reminderTime: new Date().toISOString(),
      message: `Task "${task.title}" is due in 1 hour!`,
    });
    console.log('✅ Reminder webhook sent successfully');
  } catch (error) {
    console.error('❌ Failed to send reminder webhook:', error.message);
  }
};

module.exports = { scheduleReminder, cancelReminder };