import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/complaints/${id}`);
      setComplaint(response.data);
    } catch (err) {
      console.error('Error fetching complaint:', err);
      setError(err.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-xl font-semibold mb-3 text-center">Error Loading Complaint</h2>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          
          <div className="bg-yellow-50 p-4 rounded mb-4">
            <h3 className="font-medium mb-2">Possible Solutions:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>1. Check if backend is running on port 5000</li>
              <li>2. Verify the complaint exists in database</li>
              <li>3. Check browser console for more details</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={fetchComplaint}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Complaint Not Found</h2>
          <p className="text-gray-600 mb-4">The complaint with ID "{id}" does not exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {complaint.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {complaint.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  </span>
                  <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                    {complaint.category?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                  </span>
                  <span className="text-sm text-gray-600">
                    ID: {complaint._id}
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-sm text-gray-600">Created</div>
                <div className="font-medium">
                  {complaint.createdAt ? format(new Date(complaint.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {complaint.description}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {complaint.location && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Location</h2>
                    <div className="h-64 rounded-lg overflow-hidden border">
                      <MapContainer
                        center={[
                          complaint.location.coordinates?.[1] || 28.6139,
                          complaint.location.coordinates?.[0] || 77.2090
                        ]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[
                          complaint.location.coordinates?.[1] || 28.6139,
                          complaint.location.coordinates?.[0] || 77.2090
                        ]}>
                          <Popup>
                            {complaint.location?.address || 'Complaint Location'}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                    {complaint.location?.address && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Address:</span> {complaint.location.address}
                      </p>
                    )}
                  </div>
                )}

                {/* Resolution Details */}
                {complaint.resolution && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2 text-green-800">Resolution Details</h2>
                    <p className="text-green-700 mb-2">{complaint.resolution.description}</p>
                    {complaint.resolution.resolvedAt && (
                      <p className="text-sm text-green-600">
                        Resolved on: {format(new Date(complaint.resolution.resolvedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Info Card */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg">Complaint Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{complaint.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`font-medium ${
                        complaint.priority === 'high' ? 'text-red-600' :
                        complaint.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {(complaint.priority || 'medium').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span className={`font-medium ${
                        complaint.deadline && new Date(complaint.deadline) < new Date() ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {complaint.deadline ? format(new Date(complaint.deadline), 'MMM dd, HH:mm') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Escalation Level:</span>
                      <span className="font-medium">L{complaint.escalationLevel || 1}</span>
                    </div>
                  </div>
                </div>

                {/* Submitted By */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg">Submitted By</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium">
                          {complaint.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{complaint.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-600">{complaint.user?.email || 'N/A'}</div>
                      </div>
                    </div>
                    {complaint.user?.phone && (
                      <div className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Phone:</span> {complaint.user.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;