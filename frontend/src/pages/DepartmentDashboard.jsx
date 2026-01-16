import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    description: '',
    proof: []
  });

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['departmentComplaints'],
    queryFn: async () => {
      const response = await axios.get('/api/complaints/department');
      return response.data;
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.put(`/api/complaints/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departmentComplaints']);
      toast.success('Status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const submitResolutionMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await axios.post(`/api/complaints/${selectedComplaint}/resolution`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departmentComplaints']);
      setSelectedComplaint(null);
      setResolutionData({ description: '', proof: [] });
      toast.success('Resolution submitted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit resolution');
    }
  });

  const escalateMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const response = await axios.post(`/api/complaints/${id}/escalate`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departmentComplaints']);
      toast.success('Complaint escalated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to escalate complaint');
    }
  });

  const handleProofUpload = (e) => {
    const files = Array.from(e.target.files);
    setResolutionData({
      ...resolutionData,
      proof: [...resolutionData.proof, ...files]
    });
  };

  const handleSubmitResolution = () => {
    const formData = new FormData();
    formData.append('description', resolutionData.description);
    resolutionData.proof.forEach(file => {
      formData.append('proof', file);
    });
    submitResolutionMutation.mutate(formData);
  };

  const handleEscalate = (complaintId) => {
    const reason = prompt('Reason for escalation:');
    if (reason) {
      escalateMutation.mutate({ id: complaintId, reason });
    }
  };

  const departmentComplaints = complaints?.filter(c => 
    c.escalationLevel === 1 || 
    (c.escalationLevel > 1 && c.status === 'escalated')
  );

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading complaints...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {user?.department} Department Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Complaints List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Assigned Complaints</h2>
            </div>
            <div className="divide-y">
              {departmentComplaints?.map((complaint) => (
                <div key={complaint._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{complaint.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {complaint.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          Deadline: {format(new Date(complaint.deadline), 'MMM dd, HH:mm')}
                        </span>
                        <span className="text-xs text-gray-500">
                          Level: {complaint.escalationLevel}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {complaint.status === 'pending' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ 
                            id: complaint._id, 
                            status: 'in_progress' 
                          })}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Take Action
                        </button>
                      )}
                      {complaint.status === 'in_progress' && (
                        <button
                          onClick={() => setSelectedComplaint(complaint._id)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Submit Resolution
                        </button>
                      )}
                      <button
                        onClick={() => handleEscalate(complaint._id)}
                        className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {departmentComplaints?.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No complaints assigned to your department
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resolution Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Submit Resolution</h2>
            
            {selectedComplaint ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={resolutionData.description}
                    onChange={(e) => setResolutionData({
                      ...resolutionData,
                      description: e.target.value
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Describe how the issue was resolved..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Proof (Photos/Videos)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleProofUpload}
                    className="w-full"
                  />
                  {resolutionData.proof.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {resolutionData.proof.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSubmitResolution}
                    disabled={submitResolutionMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitResolutionMutation.isLoading ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedComplaint(null);
                      setResolutionData({ description: '', proof: [] });
                    }}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Select a complaint to submit resolution
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;