const express = require('express');
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/', createTask);
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;