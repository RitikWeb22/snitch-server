const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, default: '' }
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    shortDescription: {
      type: String,
      default: ''
    },
    brand: {
      type: String,
      default: 'AURA'
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true
    },
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex'],
      default: 'unisex',
      index: true
    },
    collectionName: {
      type: String,
      default: 'Essentials'
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
      index: true
    },
    compareAtPrice: {
      type: Number,
      default: 0
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    images: {
      type: [String],
      required: [true, 'At least one image URL is required']
    },
    colors: {
      type: [String],
      default: []
    },
    sizes: {
      type: [String],
      default: []
    },
    variants: [variantSchema],
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    sku: {
      type: String,
      default: ''
    },
    material: {
      type: String,
      default: '100% Organic Cotton'
    },
    careInstructions: {
      type: String,
      default: 'Machine wash cold, gentle cycle. Hang dry.'
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
