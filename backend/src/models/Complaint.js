import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['pothole', 'garbage', 'water_leakage', 'electricity', 'road_damage', 'health_issue', 'public_nuisance'],
    required: true
  },
  department: {
    type: String,
    enum: ['cleanliness', 'construction', 'healthcare', 'water', 'electricity', 'road'],
    required: true
  },
  images: [{
    url: String,
    public_id: String
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  deadline: {
    type: Date,
    required: true
  },
  escalationLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'resolved', 'verified', 'rejected', 'escalated', 'social_media'],
    default: 'pending'
  },
  resolution: {
    proof: [{
      url: String,
      public_id: String,
      type: { type: String, enum: ['image', 'video'] }
    }],
    description: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  userConsent: {
    given: {
      type: Boolean,
      default: false
    },
    givenAt: Date,
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  escalationHistory: [{
    level: Number,
    escalatedAt: Date,
    reason: String,
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  warnings: [{
    type: String,
    sentAt: Date,
    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ deadline: 1 });
complaintSchema.index({ status: 1 });

export default mongoose.model('Complaint', complaintSchema);