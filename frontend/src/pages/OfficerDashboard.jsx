import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const OfficerDashboard = ({ level }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [extendHours, setExtendHours] = useState('24');

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['officerComplaints', level],
    queryFn: async () => {
      const response = await axios.get('/api/complaints/department');
      return response.data;
    },
    enabled: !!user,
  });

  const extendDeadlineMutation = useMutation({
    mutationFn: async ({ id, hours }) => {
      const response = await axios.put(`/api/complaints/${id}/extend-deadline`, {
        additionalHours: hours
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['officerComplaints', level]);
      toast.success('Deadline extended successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to extend deadline');
    }
  });

  const escalateMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const response = await axios.post(`/api/complaints/${id}/escalate`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['officerComplaints', level]);
      toast.success('Complaint escalated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to escalate complaint');
    }
  });

  const handleExtendDeadline = (complaintId) => {
    extendDeadlineMutation.mutate({
      id: complaintId,
      hours: parseInt(extendHours) || 24
    });
  };

  const handleEscalate = (complaintId) => {
    const reason = prompt('Reason for escalation:');
    if (reason) {
      escalateMutation.mutate({ id: complaintId, reason });
    }
  };

  const officerComplaints = complaints?.filter(c => 
    c.escalationLevel === (level === 'l2' ? 2 : 3)
  );

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading complaints...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {level.toUpperCase()} Officer Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Escalated Complaints</h2>
            </div>
            <div className="divide-y">
              {officerComplaints?.map((complaint) => (
                <div key={complaint._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{complaint.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                      
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center text-sm">
                          <span className="font-medium w-24">Department:</span>
                          <span className="text-gray-600">{complaint.department}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="font-medium w-24">Escalated From:</span>
                          <span className="text-gray-600">Level {complaint.escalationLevel - 1}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="font-medium w-24">Deadline:</span>
                          <span className={`${new Date(complaint.deadline) < new Date() ? 'text-red-600' : 'text-gray-600'}`}>
                            {format(new Date(complaint.deadline), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4 className="text-sm font-medium">Escalation History:</h4>
                        <div className="mt-1 space-y-1">
                          {complaint.escalationHistory?.map((history, idx) => (
                            <div key={idx} className="text-xs text-gray-500">
                              Level {history.level}: {history.reason} - {format(new Date(history.escalatedAt), 'MMM dd HH:mm')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="720"
                          value={extendHours}
                          onChange={(e) => setExtendHours(e.target.value)}
                          className="w-20 px-2 py-1 text-sm border rounded"
                          placeholder="Hours"
                        />
                        <button
                          onClick={() => handleExtendDeadline(complaint._id)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Extend
                        </button>
                      </div>
                      
                      {level === 'l2' && (
                        <button
                          onClick={() => handleEscalate(complaint._id)}
                          className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                        >
                          Escalate to L3
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {officerComplaints?.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No complaints escalated to your level
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Officer Actions</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">Extend Deadline</h3>
                <p className="text-sm text-blue-700 mt-1">
                  You can extend deadlines for complaints assigned to you.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-medium text-orange-900">Escalate Complaint</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {level === 'l2' 
                    ? 'Escalate to L3 officer if issue cannot be resolved.'
                    : 'As L3 officer, this is the final escalation level.'
                  }
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Statistics</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Complaints:</span>
                    <span className="font-medium">{officerComplaints?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Resolution:</span>
                    <span className="font-medium text-orange-600">
                      {officerComplaints?.filter(c => c.status !== 'resolved').length || 0}
                    </span>
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

export default OfficerDashboard;