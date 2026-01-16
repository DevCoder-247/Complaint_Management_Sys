import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  escalated: 'bg-orange-100 text-orange-800',
  social_media: 'bg-pink-100 text-pink-800',
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const { data: complaints, isLoading, refetch } = useQuery({
    queryKey: ['userComplaints'],
    queryFn: async () => {
      const response = await axios.get('/api/complaints/my-complaints');
      return response.data;
    },
  });

  useEffect(() => {
    if (complaints) {
      setStats({
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        inProgress: complaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length,
        resolved: complaints.filter(c => ['resolved', 'verified'].includes(c.status)).length,
      });
    }
  }, [complaints]);

  const handleGiveConsent = async (complaintId) => {
    try {
      await axios.post(`/api/complaints/${complaintId}/consent`, {
        consent: true,
        rating: 5,
        feedback: 'Issue resolved satisfactorily'
      });
      toast.success('Thank you for your feedback!');
      refetch();
    } catch (error) {
      toast.error('Failed to submit consent');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading complaints...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        {user?.userType === 'citizen' && (
          <Link
            to="/create-complaint"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + New Complaint
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Total Complaints</h3>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">In Progress</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">My Complaints</h2>
        </div>
        
        {complaints?.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No complaints found. {user?.userType === 'citizen' && (
              <Link to="/create-complaint" className="text-primary-600 hover:underline">
                Create your first complaint
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complaints?.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {complaint.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {complaint.category.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {complaint.department}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[complaint.priority]}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[complaint.status]}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(complaint.deadline).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(complaint.deadline), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link
                        to={`/complaint/${complaint._id}`}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        View
                      </Link>
                      {complaint.status === 'resolved' && !complaint.userConsent?.given && (
                        <button
                          onClick={() => handleGiveConsent(complaint._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;