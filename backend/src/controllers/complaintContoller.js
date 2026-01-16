import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { sendEmail } from '../utils/emailService.js';

export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, department, deadlineHours, priority } = req.body;
    
    // Validate minimum 4 hours
    const hours = Math.max(4, parseInt(deadlineHours) || 4);
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    const complaint = new Complaint({
      user: req.user._id,
      title,
      description,
      category,
      department,
      priority,
      deadline,
      location: {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude],
        address: req.body.address
      }
    });

    // Upload images if provided
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.path, 'complaints')
      );
      const results = await Promise.all(uploadPromises);
      complaint.images = results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id
      }));
    }

    await complaint.save();

    // Find department users to notify
    const departmentUsers = await User.find({ 
      userType: 'department', 
      department: complaint.department 
    });

    // Notify department users
    departmentUsers.forEach(user => {
      // Send email notification
      sendEmail(
        user.email,
        'New Complaint Assigned',
        `A new complaint has been assigned to your department: ${complaint.title}`
      );
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email');
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDepartmentComplaints = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const query = { department: user.department };
    
    // Department users see complaints assigned to their department
    if (req.user.userType === 'department') {
      query.escalationLevel = 1;
      query.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null, status: 'pending' }
      ];
    }
    
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email');
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if deadline has passed
    if (complaint.deadline < new Date() && status !== 'resolved') {
      return res.status(400).json({ 
        message: 'Deadline has passed. Please escalate or extend deadline.' 
      });
    }

    complaint.status = status;
    complaint.updatedAt = new Date();

    if (status === 'in_progress' && !complaint.assignedTo) {
      complaint.assignedTo = req.user._id;
    }

    await complaint.save();
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitResolution = async (req, res) => {
  try {
    const { description } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.deadline < new Date()) {
      return res.status(400).json({ 
        message: 'Cannot submit resolution after deadline. Please escalate.' 
      });
    }

    const proof = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.path, 'resolutions')
      );
      const results = await Promise.all(uploadPromises);
      proof.push(...results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id,
        type: result.resource_type === 'video' ? 'video' : 'image'
      })));
    }

    complaint.resolution = {
      proof,
      description,
      resolvedAt: new Date(),
      resolvedBy: req.user._id
    };
    complaint.status = 'resolved';
    complaint.updatedAt = new Date();

    await complaint.save();

    // Notify user about resolution
    const user = await User.findById(complaint.user);
    sendEmail(
      user.email,
      'Your Complaint Has Been Resolved',
      `Your complaint "${complaint.title}" has been resolved. Please review and give consent.`
    );

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const escalateComplaint = async (req, res) => {
  try {
    const { reason } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.escalationLevel >= 3) {
      return res.status(400).json({ 
        message: 'Complaint already at maximum escalation level' 
      });
    }

    complaint.escalationLevel += 1;
    complaint.escalationHistory.push({
      level: complaint.escalationLevel,
      escalatedAt: new Date(),
      reason,
      escalatedBy: req.user._id
    });
    
    // Reset assignment based on escalation level
    complaint.assignedTo = null;
    
    if (complaint.escalationLevel === 2) {
      // Find L2 officer
      const l2Officer = await User.findOne({ userType: 'l2_officer' });
      if (l2Officer) {
        complaint.assignedTo = l2Officer._id;
      }
    } else if (complaint.escalationLevel === 3) {
      // Find L3 officer
      const l3Officer = await User.findOne({ userType: 'l3_officer' });
      if (l3Officer) {
        complaint.assignedTo = l3Officer._id;
      }
    }

    // Extend deadline when escalating
    complaint.deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // Add 24 hours
    complaint.status = 'escalated';
    complaint.updatedAt = new Date();

    await complaint.save();

    // Notify assigned officer
    if (complaint.assignedTo) {
      const officer = await User.findById(complaint.assignedTo);
      sendEmail(
        officer.email,
        'Complaint Escalated to You',
        `A complaint has been escalated to your level: ${complaint.title}`
      );
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const extendDeadline = async (req, res) => {
  try {
    const { additionalHours } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Only L2 and L3 officers can extend deadlines
    if (!['l2_officer', 'l3_officer'].includes(req.user.userType)) {
      return res.status(403).json({ 
        message: 'Only L2 or L3 officers can extend deadlines' 
      });
    }

    const hours = parseInt(additionalHours) || 24;
    complaint.deadline = new Date(complaint.deadline.getTime() + hours * 60 * 60 * 1000);
    complaint.updatedAt = new Date();

    await complaint.save();
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};