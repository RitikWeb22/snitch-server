const dns = require('dns');
const mongoose = require('mongoose');

// On Windows, Node.js default DNS resolver often fails with querySrv ECONNREFUSED for Atlas.
// Setting public DNS servers ensures reliable SRV record resolution.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore fallback
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clothing_ecommerce',
      { serverSelectionTimeoutMS: 5000 }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('Warning: Server operating with in-memory store fallback.');
  }
};

module.exports = connectDB;
