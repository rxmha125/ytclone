const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

async function connectDB() {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGODB);

    await mongoose.connect(process.env.MONGODB, { 
      dbName: 'rxtube',
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });

    console.log('MongoDB connected successfully to the rxtube database');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process on connection failure
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

// Export User model
module.exports = mongoose.model("User", userSchema, "users");
