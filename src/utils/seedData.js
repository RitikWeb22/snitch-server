const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');

const categoriesData = [
  {
    name: 'T-Shirts',
    slug: 't-shirts',
    description: 'Heavyweight organic cotton tees crafted for an effortless relaxed fit.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'
  },
  {
    name: 'Shirts',
    slug: 'shirts',
    description: 'Tailored and relaxed poplin & linen button-downs for contemporary layering.',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80'
  },
  {
    name: 'Hoodies',
    slug: 'hoodies',
    description: 'Ultra-soft French terry fleeces designed with dropped shoulders & structural double hoods.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80'
  },
  {
    name: 'Jackets',
    slug: 'jackets',
    description: 'Minimal outerwear including wool overcoats, bomber jackets, and structured blazers.',
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80'
  },
  {
    name: 'Jeans',
    slug: 'jeans',
    description: 'Raw denim and washed straight-leg denim crafted from sustainable cotton canvas.',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80'
  },
  {
    name: 'Trousers',
    slug: 'trousers',
    description: 'Pleated wide-leg wool trousers and tailored relaxed pants.',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80'
  },
  {
    name: 'Dresses',
    slug: 'dresses',
    description: 'Architectural silk slip dresses, ribbed midi dresses, and linen shirt dresses.',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Leather totes, minimal silver hardware, and ribbed cashmere beanies.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80'
  }
];

const productsData = [
  {
    name: 'Heavyweight Boxy Tee',
    slug: 'heavyweight-boxy-tee',
    description: 'Constructed from 280 GSM 100% organic combed cotton, this heavyweight boxy tee features a rib collar, dropped shoulders, and a clean minimalist aesthetic.',
    shortDescription: '280 GSM heavyweight organic cotton tee with dropped shoulders.',
    brand: 'AURA Studio',
    category: 'T-Shirts',
    gender: 'unisex',
    collectionName: 'Minimal Essentials',
    price: 1899,
    compareAtPrice: 2499,
    discountPercentage: 24,
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1000&q=80'
    ],
    colors: ['Off-White', 'Black', 'Sand'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 45,
    sku: 'TEE-BOX-001',
    material: '100% Organic Combed Cotton',
    careInstructions: 'Machine wash cold inside out. Line dry in shade.',
    tags: ['tshirt', 'cotton', 'boxy', 'minimal', 'basics'],
    rating: 4.8,
    reviewCount: 34,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true
  },
  {
    name: 'Oversized Washed Graphic Tee',
    slug: 'oversized-washed-graphic-tee',
    description: 'Vintage vintage-wash tee featuring custom minimalist typography artwork on the chest and back. Enzyme washed for ultimate drape.',
    shortDescription: 'Vintage wash tee with subtle chest graphic.',
    brand: 'AURA Editorial',
    category: 'T-Shirts',
    gender: 'men',
    collectionName: 'Editorial Line',
    price: 2199,
    compareAtPrice: 2799,
    discountPercentage: 21,
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1000&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1000&q=80'
    ],
    colors: ['Charcoal Wash', 'Faded Olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 20,
    sku: 'TEE-GRA-002',
    material: '100% Cotton',
    careInstructions: 'Machine wash cold. Do not iron print.',
    tags: ['tshirt', 'graphic', 'vintage', 'streetwear'],
    rating: 4.6,
    reviewCount: 18,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false
  },
  {
    name: 'Relaxed Poplin Overshirt',
    slug: 'relaxed-poplin-overshirt',
    description: 'Cut from crisp Italian cotton poplin, this overshirt features a refined point collar, clean chest patch pocket, and mother-of-pearl buttons.',
    shortDescription: 'Crisp Italian poplin cotton overshirt for year-round layering.',
    brand: 'AURA Atelier',
    category: 'Shirts',
    gender: 'unisex',
    collectionName: 'Summer 2026',
    price: 3499,
    compareAtPrice: 4299,
    discountPercentage: 18,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&q=80'
    ],
    colors: ['Sky Blue', 'White', 'Midnight Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 30,
    sku: 'SHRT-POP-001',
    material: '100% Fine Cotton Poplin',
    careInstructions: 'Dry clean recommended or machine wash cold gentle.',
    tags: ['shirt', 'poplin', 'overshirt', 'formal', 'smart-casual'],
    rating: 4.9,
    reviewCount: 42,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true
  },
  {
    name: 'Textured Linen Button-Down',
    slug: 'textured-linen-button-down',
    description: 'Breathable European flax linen shirt featuring a soft camp collar and natural texture. Perfect for warm climate capsule wardrobes.',
    shortDescription: '100% European flax linen camp collar shirt.',
    brand: 'AURA Resort',
    category: 'Shirts',
    gender: 'men',
    collectionName: 'Summer 2026',
    price: 3299,
    compareAtPrice: 3999,
    discountPercentage: 17,
    images: [
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=1000&q=80',
      'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=1000&q=80'
    ],
    colors: ['Natural Sand', 'Olive', 'Crisp White'],
    sizes: ['M', 'L', 'XL'],
    stock: 15,
    sku: 'SHRT-LIN-002',
    material: '100% European Flax Linen',
    careInstructions: 'Hand wash or delicate cycle cold.',
    tags: ['shirt', 'linen', 'resort', 'summer'],
    rating: 4.7,
    reviewCount: 26,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false
  },
  {
    name: 'Architectural Heavy Hoodie',
    slug: 'architectural-heavy-hoodie',
    description: 'Engineered with 480 GSM organic French terry fleece. Features a double-layered hood without drawstrings, seamless kangaroo pocket, and structured ribbing.',
    shortDescription: '480 GSM French terry fleece hoodie with architectural silhouette.',
    brand: 'AURA Studio',
    category: 'Hoodies',
    gender: 'unisex',
    collectionName: 'Minimal Essentials',
    price: 4999,
    compareAtPrice: 5999,
    discountPercentage: 16,
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1000&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1000&q=80'
    ],
    colors: ['Black', 'Concrete Gray', 'Bone'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 50,
    sku: 'HD-HVY-001',
    material: '100% Organic French Terry Cotton',
    careInstructions: 'Machine wash cold gentle. Do not tumble dry.',
    tags: ['hoodie', 'fleece', 'heavyweight', 'streetwear'],
    rating: 4.95,
    reviewCount: 58,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true
  },
  {
    name: 'Minimal Wool Blend Tailored Blazer',
    slug: 'minimal-wool-blend-tailored-blazer',
    description: 'Single-breasted relaxed blazer tailored from virgin wool blend fabric. Fully lined with notch lapels and discreet side welt pockets.',
    shortDescription: 'Relaxed virgin wool blend single-breasted blazer.',
    brand: 'AURA Atelier',
    category: 'Jackets',
    gender: 'women',
    collectionName: 'Editorial Line',
    price: 8999,
    compareAtPrice: 10999,
    discountPercentage: 18,
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=1000&q=80',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&q=80'
    ],
    colors: ['Obsidian Black', 'Espresso Brown'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 12,
    sku: 'JCK-BLZ-001',
    material: '70% Virgin Wool, 30% Polyester',
    careInstructions: 'Dry clean only.',
    tags: ['blazer', 'wool', 'tailored', 'formal', 'outerwear'],
    rating: 4.85,
    reviewCount: 19,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: false
  },
  {
    name: 'Cropped Denim Trucker Jacket',
    slug: 'cropped-denim-trucker-jacket',
    description: '14oz selvedge denim trucker jacket featuring custom matte hardware, subtle contrast stitching, and an elevated cropped proportion.',
    shortDescription: '14oz Japanese selvedge denim cropped trucker jacket.',
    brand: 'AURA Denim',
    category: 'Jackets',
    gender: 'unisex',
    collectionName: 'Minimal Essentials',
    price: 5499,
    compareAtPrice: 6499,
    discountPercentage: 15,
    images: [
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=1000&q=80',
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1000&q=80'
    ],
    colors: ['Raw Indigo', 'Washed Black'],
    sizes: ['S', 'M', 'L'],
    stock: 22,
    sku: 'JCK-DNM-002',
    material: '100% Cotton Selvedge Denim',
    careInstructions: 'Wash inside out cold with dark colors.',
    tags: ['jacket', 'denim', 'trucker', 'outerwear'],
    rating: 4.7,
    reviewCount: 31,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: true
  },
  {
    name: 'Straight-Leg Raw Selvedge Jeans',
    slug: 'straight-leg-raw-selvedge-jeans',
    description: 'Classic high-rise straight leg jeans crafted from 13.5oz Japanese denim. Features five-pocket styling and custom leather patch detail.',
    shortDescription: '13.5oz raw Japanese selvedge denim straight jeans.',
    brand: 'AURA Denim',
    category: 'Jeans',
    gender: 'men',
    collectionName: 'Minimal Essentials',
    price: 4499,
    compareAtPrice: 5299,
    discountPercentage: 15,
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000&q=80',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1000&q=80'
    ],
    colors: ['Raw Indigo', 'Stone Wash'],
    sizes: ['30', '32', '34', '36'],
    stock: 28,
    sku: 'JNS-STR-001',
    material: '100% Selvedge Cotton Denim',
    careInstructions: 'Wash rarely, cold water inside out.',
    tags: ['jeans', 'denim', 'selvedge', 'pants'],
    rating: 4.9,
    reviewCount: 44,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true
  },
  {
    name: 'Pleated Wide-Leg Wool Trousers',
    slug: 'pleated-wide-leg-wool-trousers',
    description: 'Fluid wide-leg trousers cut with deep double front pleats and side adjusters. Designed to break gracefully over footwear.',
    shortDescription: 'High-waisted double-pleated wide leg wool trousers.',
    brand: 'AURA Atelier',
    category: 'Trousers',
    gender: 'women',
    collectionName: 'Editorial Line',
    price: 4999,
    compareAtPrice: 5999,
    discountPercentage: 16,
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1000&q=80',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1000&q=80'
    ],
    colors: ['Taupe', 'Midnight Black', 'Charcoal'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 18,
    sku: 'TRS-PLT-001',
    material: '80% Tropical Wool, 20% Polyester',
    careInstructions: 'Dry clean only.',
    tags: ['trousers', 'pleated', 'wide-leg', 'wool', 'tailored'],
    rating: 4.8,
    reviewCount: 22,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false
  },
  {
    name: 'Architectural Silk Slip Dress',
    slug: 'architectural-silk-slip-dress',
    description: 'Bias-cut 100% mulberry silk slip dress featuring delicate adjustable shoulder straps and an asymmetrical midi hemline.',
    shortDescription: '100% Mulberry silk bias-cut slip dress.',
    brand: 'AURA Atelier',
    category: 'Dresses',
    gender: 'women',
    collectionName: 'Editorial Line',
    price: 7999,
    compareAtPrice: 9999,
    discountPercentage: 20,
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&q=80',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1000&q=80'
    ],
    colors: ['Emerald Green', 'Champagne', 'Onyx Black'],
    sizes: ['XS', 'S', 'M'],
    stock: 10,
    sku: 'DRS-SLK-001',
    material: '100% Mulberry Silk',
    careInstructions: 'Dry clean or hand wash cold with silk detergent.',
    tags: ['dress', 'silk', 'slip-dress', 'evening', 'luxury'],
    rating: 4.95,
    reviewCount: 37,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true
  },
  {
    name: 'Ribbed Knit Midi Dress',
    slug: 'ribbed-knit-midi-dress',
    description: 'Form-fitting midi dress rendered in a soft ribbed cotton-viscose blend. Features a mock neck collar and clean silhouette.',
    shortDescription: 'Soft cotton-viscose mock neck ribbed midi dress.',
    brand: 'AURA Studio',
    category: 'Dresses',
    gender: 'women',
    collectionName: 'Minimal Essentials',
    price: 3899,
    compareAtPrice: 4599,
    discountPercentage: 15,
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1000&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1000&q=80'
    ],
    colors: ['Oatmeal', 'Black'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 25,
    sku: 'DRS-KNT-002',
    material: '60% Cotton, 40% Viscose',
    careInstructions: 'Machine wash cold flat dry.',
    tags: ['dress', 'knit', 'midi', 'casual'],
    rating: 4.6,
    reviewCount: 15,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false
  },
  {
    name: 'Minimal Calfskin Leather Tote',
    slug: 'minimal-calfskin-leather-tote',
    description: 'Unstructured open tote handcrafted from full-grain Italian calfskin leather. Includes an unlined suede interior with detachable zip pouch.',
    shortDescription: 'Full-grain Italian calfskin leather unlined tote.',
    brand: 'AURA Goods',
    category: 'Accessories',
    gender: 'unisex',
    collectionName: 'Minimal Essentials',
    price: 6999,
    compareAtPrice: 8499,
    discountPercentage: 17,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&q=80',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1000&q=80'
    ],
    colors: ['Black Leather', 'Cognac Tan'],
    sizes: ['One Size'],
    stock: 14,
    sku: 'ACC-TOT-001',
    material: '100% Full-Grain Italian Calfskin',
    careInstructions: 'Wipe clean with soft damp cloth and leather conditioner.',
    tags: ['leather', 'tote', 'bag', 'accessories'],
    rating: 4.9,
    reviewCount: 49,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true
  }
];

const couponsData = [
  {
    code: 'AURA10',
    type: 'percentage',
    value: 10,
    minOrderValue: 1000,
    maxDiscount: 500,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'WELCOME20',
    type: 'percentage',
    value: 20,
    minOrderValue: 2000,
    maxDiscount: 1000,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'SUMMER500',
    type: 'fixed',
    value: 500,
    minOrderValue: 3000,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clothing_ecommerce';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Coupon.deleteMany({});
    await User.deleteMany({ email: { $in: ['admin@aura.fashion', 'customer@aura.fashion'] } });

    console.log('Seeding Categories...');
    const insertedCategories = await Category.insertMany(categoriesData);
    console.log(`Created ${insertedCategories.length} categories.`);

    console.log('Seeding Products...');
    const productsWithVariants = productsData.map(p => {
      const variants = [];
      p.colors.forEach(c => {
        p.sizes.forEach(s => {
          variants.push({
            color: c,
            size: s,
            stock: Math.floor(Math.random() * 15) + 5,
            sku: `${p.sku}-${c.substring(0, 3).toUpperCase()}-${s}`
          });
        });
      });
      return {
        ...p,
        variants
      };
    });

    const insertedProducts = await Product.insertMany(productsWithVariants);
    console.log(`Created ${insertedProducts.length} products with size/color variants.`);

    console.log('Seeding Coupons...');
    await Coupon.insertMany(couponsData);
    console.log('Created discount coupons.');

    console.log('Seeding Demo Users...');
    await User.create([
      {
        name: 'Aura Store Admin',
        email: 'admin@aura.fashion',
        googleId: 'demo_admin_123',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '+91 98765 00000',
        addresses: [
          {
            name: 'Aura Store Admin',
            phone: '+91 98765 00000',
            addressLine1: 'Headquarters, 100 Fashion Avenue',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India',
            isDefault: true
          }
        ]
      },
      {
        name: 'Sophia Laurent',
        email: 'customer@aura.fashion',
        googleId: 'demo_user_123',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '+91 98765 43210',
        addresses: [
          {
            name: 'Sophia Laurent',
            phone: '+91 98765 43210',
            addressLine1: '42 Fashion Boulevard, Suite 100',
            addressLine2: 'Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400050',
            country: 'India',
            isDefault: true
          }
        ]
      }
    ]);
    console.log('Created Demo Admin & Customer accounts.');

    console.log('Database seeding complete successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
};

seedDB();
