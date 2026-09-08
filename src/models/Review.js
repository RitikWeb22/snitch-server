const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    title: {
      type: String,
      required: [true, 'Review headline/title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    verifiedPurchase: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved',
      index: true
    },
    adminReply: {
      comment: {
        type: String,
        default: '',
        trim: true
      },
      repliedAt: {
        type: Date
      },
      repliedBy: {
        type: String,
        default: 'Maison Vogue Concierge'
      }
    }
  },
  {
    timestamps: true
  }
);

// Prevent same user from posting multiple reviews on the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to recalculate average rating and review count on the Product model
reviewSchema.statics.getAverageRating = async function (productId) {
  const Product = mongoose.model('Product');

  if (!mongoose.Types.ObjectId.isValid(productId)) return;

  const stats = await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].reviewCount
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 4.5,
        reviewCount: 0
      });
    }
  } catch (err) {
    console.error('Error updating product average rating:', err);
  }
};

// Post-save hook to recalculate rating
reviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.product);
});

// Post-remove hook to recalculate rating
reviewSchema.post('remove', async function () {
  await this.constructor.getAverageRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
