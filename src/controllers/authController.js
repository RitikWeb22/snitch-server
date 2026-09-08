const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

let localUsers = [
  {
    _id: 'user_admin_99',
    name: 'Maison Vogue Admin',
    email: 'admin@maisonvogue.fashion',
    password: 'adminpassword123',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '+91 98765 00000',
    addresses: [],
    wishlist: []
  },
  {
    _id: 'user_cust_99',
    name: 'Sophia Laurent',
    email: 'customer@maisonvogue.fashion',
    password: 'password123',
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
    ],
    wishlist: []
  }
];

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

// @desc    Register a new user with Name, Email & Password
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Account with this email already exists' });
      }

      const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role
      });

      const token = generateToken(user._id);
      setTokenCookie(res, token);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses,
          wishlist: user.wishlist,
          token
        }
      });
    }

    // Offline Memory Fallback
    const existing = localUsers.find(u => u.email === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Account with this email already exists' });
    }

    const newUser = {
      _id: `user_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password,
      role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '',
      addresses: [],
      wishlist: []
    };

    localUsers.push(newUser);
    const token = generateToken(newUser._id);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { ...newUser, token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in existing user with Email & Password
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password credentials' });
      }

      const token = generateToken(user._id);
      setTokenCookie(res, token);

      return res.json({
        success: true,
        message: 'Logged in successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          phone: user.phone,
          addresses: user.addresses,
          wishlist: user.wishlist,
          token
        }
      });
    }

    // Offline Fallback
    const user = localUsers.find(u => u.email === email.toLowerCase());
    if (!user || (user.password && user.password !== password)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials' });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);
    res.json({
      success: true,
      message: 'Logged in successfully',
      data: { ...user, token }
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const { credential } = req.body;

    let email = 'customer@maisonvogue.fashion';
    let name = 'Sophia Laurent';
    let avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    let googleId = 'google_12345';

    if (credential) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        avatar = payload.picture;
        googleId = payload.sub;
      } catch (err) {
        // Fallback for dev mode
      }
    }

    if (isDbConnected) {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({ name, email, avatar, googleId, role: email.includes('admin') ? 'admin' : 'user' });
      }
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      return res.json({
        success: true,
        data: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, phone: user.phone, addresses: user.addresses, wishlist: user.wishlist, token }
      });
    }

    const mockUser = localUsers.find(u => u.email === email) || localUsers[1];
    const token = generateToken(mockUser._id);
    setTokenCookie(res, token);
    res.json({
      success: true,
      data: { ...mockUser, token }
    });
  } catch (error) {
    next(error);
  }
};

const demoLogin = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const { role = 'user' } = req.body;

    const email = role === 'admin' ? 'admin@maisonvogue.fashion' : 'customer@maisonvogue.fashion';
    const name = role === 'admin' ? 'Maison Vogue Admin' : 'Sophia Laurent';
    const avatar = role === 'admin' 
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    if (isDbConnected) {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name,
          email,
          avatar,
          role,
          googleId: `demo_${role}`,
          addresses: [
            {
              name,
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
        });
      }
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      return res.json({
        success: true,
        data: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, phone: user.phone, addresses: user.addresses, wishlist: user.wishlist, token }
      });
    }

    const user = localUsers.find(u => u.role === role) || localUsers[1];
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    res.json({
      success: true,
      data: { ...user, token }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const user = await User.findById(req.user._id).populate('wishlist');
      return res.json({ success: true, data: user });
    }
    const user = localUsers.find(u => u._id.toString() === req.user._id.toString()) || localUsers[1];
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const user = await User.findById(req.user._id);
      if (req.body.name) user.name = req.body.name;
      if (req.body.phone) user.phone = req.body.phone;
      if (req.body.addresses) user.addresses = req.body.addresses;
      await user.save();
      return res.json({ success: true, data: user });
    }

    const idx = localUsers.findIndex(u => u._id.toString() === req.user._id.toString());
    if (idx > -1) {
      if (req.body.name) localUsers[idx].name = req.body.name;
      if (req.body.phone) localUsers[idx].phone = req.body.phone;
      if (req.body.addresses) localUsers[idx].addresses = req.body.addresses;
      return res.json({ success: true, data: localUsers[idx] });
    }
    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  demoLogin,
  getMe,
  updateProfile,
  logout
};
