const mongoose = require('mongoose');
const Category = require('../models/Category');
const { categoriesData } = require('../utils/mockStore');

let localCategories = [...categoriesData];

const getCategories = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const categories = await Category.find({ isActive: true }).sort({ name: 1 });
      return res.json({ success: true, data: categories });
    }
    res.json({ success: true, data: localCategories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const category = await Category.create({ name, slug, description, image });
      return res.status(201).json({ success: true, message: 'Category created', data: category });
    }

    const newCat = { _id: `cat_${Date.now()}`, name, slug, description, image, isActive: true };
    localCategories.push(newCat);
    res.status(201).json({ success: true, message: 'Category created', data: newCat });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const category = await Category.findById(req.params.id);
      if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
      Object.assign(category, req.body);
      await category.save();
      return res.json({ success: true, message: 'Category updated', data: category });
    }

    const idx = localCategories.findIndex(c => c._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Category not found' });
    localCategories[idx] = { ...localCategories[idx], ...req.body };
    res.json({ success: true, message: 'Category updated', data: localCategories[idx] });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
      return res.json({ success: true, message: 'Category deleted' });
    }

    localCategories = localCategories.filter(c => c._id !== req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
