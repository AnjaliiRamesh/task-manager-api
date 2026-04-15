// In-memory store for scheduled reminders
// Key: taskId, Value: timeout reference
const scheduledReminders = {};

const addReminder = (taskId, timeoutRef) => {
  scheduledReminders[taskId] = timeoutRef;
};

const removeReminder = (taskId) => {
  if (scheduledReminders[taskId]) {
    clearTimeout(scheduledReminders[taskId]);
    delete scheduledReminders[taskId];
    return true;
  }
  return false;
};

const hasReminder = (taskId) => {
  return !!scheduledReminders[taskId];
};

module.exports = { addReminder, removeReminder, hasReminder };