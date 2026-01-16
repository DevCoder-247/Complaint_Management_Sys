import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    enum: ['citizen', 'department', 'l2_officer', 'l3_officer', 'admin'],
    default: 'citizen'
  },
  department: {
    type: String,
    enum: ['cleanliness', 'construction', 'healthcare', 'water', 'electricity', 'road'],
    required: function() {
      return this.userType === 'department';
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);