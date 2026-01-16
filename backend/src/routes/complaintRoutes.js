// Create new complaint with better validation
router.post('/create', protect, authorize('citizen'), async (req, res) => {
  try {
    console.log('=== CREATE COMPLAINT REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    console.log('===============================');
    
    const {
      title,
      description,
      category,
      department,
      priority,
      deadlineHours,
      latitude,
      longitude,
      address
    } = req.body;
    
    // Detailed validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!description || description.trim().length === 0) {
      errors.push('Description is required');
    }
    
    if (!category) {
      errors.push('Category is required');
    }
    
    if (!department) {
      errors.push('Department is required');
    }
    
    if (!deadlineHours || isNaN(deadlineHours) || parseInt(deadlineHours) < 4) {
      errors.push('Deadline must be at least 4 hours');
    }
    
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors,
        receivedData: req.body
      });
    }
    
    // Calculate deadline
    const hours = Math.max(4, parseInt(deadlineHours));
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    
    // Create complaint
    const complaint = new Complaint({
      user: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category,
      department: department,
      priority: priority || 'medium',
      deadline: deadline,
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(longitude) || 77.2090, // longitude first for GeoJSON
          parseFloat(latitude) || 28.6139   // latitude second
        ],
        address: address || 'Location not specified'
      },
      status: 'pending',
      escalationLevel: 1
    });
    
    console.log('Creating complaint:', complaint);
    
    await complaint.save();
    
    // Populate user info
    const savedComplaint = await Complaint.findById(complaint._id)
      .populate('user', 'name email')
      .lean();
    
    console.log('Complaint created successfully:', savedComplaint._id);
    
    res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      complaint: savedComplaint
    });
    
  } catch (error) {
    console.error('Error creating complaint:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      message: 'Server error creating complaint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});