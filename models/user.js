const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

async function connectDB() {
  try {
    console.log("Connecting to MongoDB with URI:", process.env.MONGODB);
    await mongoose.connect(process.env.MONGODB, { dbName: 'rxtube' }); // Specify the database name
    console.log('MongoDB connected to rxtube database successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if connection fails
  }
}

connectDB();

// Define User Schema
const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  age: Number,
  username: String,
});

// Export User model and specify 'users' as the collection name
module.exports = mongoose.model("User", userSchema, "users");
