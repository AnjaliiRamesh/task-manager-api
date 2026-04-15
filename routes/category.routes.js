const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const authenticate = require('../middleware/auth.middleware');

// All category routes are protected
router.use(authenticate);

router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;