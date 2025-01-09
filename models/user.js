const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

// Establish connection using the value from .env and specify the 'socialmedia' database
console.log("Connecting to MongoDB with URI:", process.env.MONGODB);
mongoose.connect(process.env.MONGODB, { dbName: 'rxtube' }) // Specify the database name here
  .then(() => {
    console.log('MongoDB connected to socialmedia database successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Define User Schema
const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  age: Number,
  username: String,
});

// Export User model and specify 'users' as the collection name
module.exports = mongoose.model("User", userSchema, "users");  // 'users' will be the collection name