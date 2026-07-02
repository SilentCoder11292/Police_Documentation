const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
      type: String,
      enum: {
        values: ['Admin', 'User'],
        message: 'Role must be either Admin or User'
      },
      default: 'User'
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['Active', 'Disabled'],
        message: 'Account status must be either Active or Disabled'
      },
      default: 'Active'
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required for 2FA SMS dispatch'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  // Only hash if modified or new
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Helper method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
