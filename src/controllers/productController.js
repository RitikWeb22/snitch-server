const mongoose = require('mongoose');
const Product = require('../models/Product');
const { productsData } = require('../utils/mockStore');

let localProducts = [...productsData];

const getProducts = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    if (isDbConnected) {
      const query = { isActive: true };

      if (req.query.search || req.query.q) {
        const searchPattern = new RegExp(req.query.search || req.query.q, 'i');
        query.$or = [
          { name: searchPattern },
          { description: searchPattern },
          { brand: searchPattern },
          { category: searchPattern },
          { collectionName: searchPattern },
          { tags: searchPattern }
        ];
      }

      if (req.query.category && req.query.category !== 'all') {
        query.category = new RegExp(`^${req.query.category}$`, 'i');
      }

      if (req.query.gender && req.query.gender !== 'all') {
        query.gender = { $in: [req.query.gender.toLowerCase(), 'unisex'] };
      }

      if (req.query.size) {
        const sizes = Array.isArray(req.query.size) ? req.query.size : req.query.size.split(',');
        query.sizes = { $in: sizes };
      }

      if (req.query.color) {
        const colors = Array.isArray(req.query.color) ? req.query.color : req.query.color.split(',');
        query.colors = { $in: colors.map(c => new RegExp(c, 'i')) };
      }

      if (req.query.minPrice || req.query.maxPrice) {
        query.price = {};
        if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
      }

      if (req.query.inStock === 'true') {
        query.stock = { $gt: 0 };
      }

      if (req.query.collection) {
        query.collectionName = new RegExp(req.query.collection, 'i');
      }

      if (req.query.isFeatured === 'true') query.isFeatured = true;
      if (req.query.isNewArrival === 'true') query.isNewArrival = true;
      if (req.query.isBestSeller === 'true') query.isBestSeller = true;

      let sort = {};
      switch (req.query.sort) {
        case 'newest': sort = { createdAt: -1 }; break;
        case 'price_asc': sort = { price: 1 }; break;
        case 'price_desc': sort = { price: -1 }; break;
        case 'popularity': sort = { reviewCount: -1, rating: -1 }; break;
        case 'featured':
        default: sort = { isFeatured: -1, createdAt: -1 }; break;
      }

      const totalProducts = await Product.countDocuments(query);
      const products = await Product.find(query).sort(sort).skip(skip).limit(limit);

      return res.json({
        success: true,
        data: { products, page, pages: Math.ceil(totalProducts / limit) || 1, totalProducts }
      });
    }

    // --- Fallback in-memory query processing if DB not connected ---
    let filtered = localProducts.filter(p => p.isActive);

    const searchTerm = (req.query.search || req.query.q || '').toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm)))
      );
    }

    if (req.query.category && req.query.category !== 'all') {
      filtered = filtered.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
    }

    if (req.query.gender && req.query.gender !== 'all') {
      filtered = filtered.filter(p => p.gender === req.query.gender.toLowerCase() || p.gender === 'unisex');
    }

    if (req.query.minPrice) {
      filtered = filtered.filter(p => p.price >= Number(req.query.minPrice));
    }

    if (req.query.maxPrice) {
      filtered = filtered.filter(p => p.price <= Number(req.query.maxPrice));
    }

    if (req.query.isFeatured === 'true') filtered = filtered.filter(p => p.isFeatured);
    if (req.query.isNewArrival === 'true') filtered = filtered.filter(p => p.isNewArrival);
    if (req.query.isBestSeller === 'true') filtered = filtered.filter(p => p.isBestSeller);

    if (req.query.sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    else if (req.query.sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);

    const totalProducts = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        products: paginated,
        page,
        pages: Math.ceil(totalProducts / limit) || 1,
        totalProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const product = await Product.findOne({ slug: req.params.slug, isActive: true });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      const relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        isActive: true
      }).limit(4);

      return res.json({ success: true, data: { product, relatedProducts } });
    }

    const product = localProducts.find(p => p.slug === req.params.slug);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const relatedProducts = localProducts.filter(p => p.category === product.category && p._id !== product._id).slice(0, 4);

    res.json({ success: true, data: { product, relatedProducts } });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({ success: true, data: product });
    }

    const product = localProducts.find(p => p._id === req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const slug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (isDbConnected) {
      const product = await Product.create({ ...req.body, slug });
      return res.status(201).json({ success: true, message: 'Product created', data: product });
    }

    const newProd = {
      _id: `prod_${Date.now()}`,
      ...req.body,
      slug,
      isActive: true,
      createdAt: new Date()
    };
    localProducts.unshift(newProd);
    res.status(201).json({ success: true, message: 'Product created', data: newProd });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      Object.assign(product, req.body);
      await product.save();
      return res.json({ success: true, message: 'Product updated', data: product });
    }

    const idx = localProducts.findIndex(p => p._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found' });
    localProducts[idx] = { ...localProducts[idx], ...req.body };
    res.json({ success: true, message: 'Product updated', data: localProducts[idx] });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      return res.json({ success: true, message: 'Product deleted' });
    }

    localProducts = localProducts.filter(p => p._id !== req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
