import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.title || !formData.description) {
    toast.error('Please fill in all required fields');
    return;
  }

  setLoading(true);
  
  try {
    // Find department for selected category
    const selectedCategory = categories.find(cat => cat.value === formData.category);
    
    const complaintData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      department: selectedCategory?.department || 'general',
      priority: formData.priority,
      deadlineHours: formData.deadlineHours,
      latitude: 28.6139, // Default coordinates (Delhi)
      longitude: 77.2090,
      address: 'Location not specified'
    };

    console.log('📤 Submitting complaint data:', complaintData);
    
    const response = await api.post('/complaints/create', complaintData);
    
    console.log('📥 Response received:', response.data);
    toast.success('Complaint created successfully!');
    navigate('/');
    
  } catch (error) {
    console.error('❌ Submission error details:', {
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      request: error.request,
      message: error.message
    });
    
    // Show detailed error message
    if (error.response?.data?.errors) {
      const errorMessages = error.response.data.errors.join(', ');
      toast.error(`Validation errors: ${errorMessages}`);
    } else if (error.response?.data?.message) {
      toast.error(`Server error: ${error.response.data.message}`);
    } else if (error.request) {
      toast.error('No response from server. Is backend running?');
    } else {
      toast.error(`Error: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categories = [
  { value: 'pothole', label: 'Pothole', department: 'road' },
  { value: 'garbage', label: 'Garbage Overflow', department: 'cleanliness' },
  { value: 'water_leakage', label: 'Water Leakage', department: 'water' },
  { value: 'electricity', label: 'Electricity Issue', department: 'electricity' },
  { value: 'road_damage', label: 'Road Damage', department: 'construction' },
  { value: 'health_issue', label: 'Health Issue', department: 'healthcare' },
  { value: 'public_nuisance', label: 'Public Nuisance', department: 'cleanliness' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

function LocationPicker({ setPosition, setAddress }) {
  const [position, setLocalPosition] = useState(null);

  useMapEvents({
    click(e) {
      setLocalPosition(e.latlng);
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      
      // Reverse geocoding to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(response => response.json())
        .then(data => {
          setAddress(data.display_name || 'Address not found');
        })
        .catch(() => {
          setAddress('Address not found');
        });
    },
  });

  return position ? <Marker position={position} /> : null;
}

const CreateComplaint = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedCategory = watch('category');
  const selectedDepartment = categories.find(cat => cat.value === selectedCategory)?.department;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition({ lat: latitude, lng: longitude });
          setValue('latitude', latitude);
          setValue('longitude', longitude);
          
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              setAddress(data.display_name || 'Address not found');
            })
            .catch(() => {
              setAddress('Address not found');
            });
        },
        (error) => {
          toast.error('Unable to retrieve your location');
          console.error(error);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const onSubmit = async (data) => {
    if (!position) {
      toast.error('Please select a location on the map');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('department', selectedDepartment);
    formData.append('priority', data.priority);
    formData.append('deadlineHours', data.deadlineHours);
    formData.append('latitude', position.lat);
    formData.append('longitude', position.lng);
    formData.append('address', address);
    
    images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const response = await axios.post('/api/complaints/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Complaint submitted successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Complaint</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Brief description of the issue"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <textarea
            {...register('description', { 
              required: 'Description is required',
              minLength: { value: 20, message: 'Minimum 20 characters required' }
            })}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Detailed description of the issue..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} ({cat.department})
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
            {selectedDepartment && (
              <p className="text-sm text-gray-600 mt-1">
                Will be assigned to: {selectedDepartment} department
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority *</label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Priority</option>
              {priorities.map((pri) => (
                <option key={pri.value} value={pri.value}>
                  {pri.label}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
            )}
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Resolution Deadline (minimum 4 hours) *
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              {...register('deadlineHours', { 
                required: 'Deadline is required',
                min: { value: 4, message: 'Minimum 4 hours required' },
                max: { value: 720, message: 'Maximum 720 hours (30 days)' }
              })}
              className="w-32 px-3 py-2 border rounded-lg"
              placeholder="Hours"
              min="4"
              max="720"
            />
            <span className="text-gray-600">hours from now</span>
          </div>
          {errors.deadlineHours && (
            <p className="text-red-500 text-sm mt-1">{errors.deadlineHours.message}</p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Upload Images (Max 5) *
          </label>
          <div className="border-2 border-dashed rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center justify-center py-4"
            >
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="mt-2 text-sm">Click to upload images</span>
              <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</span>
            </label>
          </div>
          
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length === 0 && (
            <p className="text-red-500 text-sm mt-1">At least one image is required</p>
          )}
        </div>

        {/* Location Picker */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Location *</label>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              Use Current Location
            </button>
          </div>
          
          <div className="h-64 border rounded-lg overflow-hidden">
            <MapContainer
              center={[20.5937, 78.9629]} // Center of India
              zoom={5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationPicker setPosition={setPosition} setAddress={setAddress} />
            </MapContainer>
          </div>
          
          {position && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <p className="text-sm">
                <strong>Selected Location:</strong> {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
              <p className="text-sm mt-1">
                <strong>Address:</strong> {address || 'Fetching address...'}
              </p>
            </div>
          )}
          {!position && (
            <p className="text-red-500 text-sm mt-1">Please select a location on the map</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border rounded-lg mr-3"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            disabled={loading || !position || images.length === 0}
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateComplaint;