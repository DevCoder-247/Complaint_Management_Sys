import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

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

const ComplaintCard = ({ complaint }) => {
  return (
    <div className="bg-white rounded-lg shadow hover-card p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{complaint.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{complaint.description}</p>
          
          <div className="flex items-center space-x-4 mt-3">
            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[complaint.status]}`}>
              {complaint.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[complaint.priority]}`}>
              {complaint.priority}
            </span>
            <span className="text-xs text-gray-500">
              Level {complaint.escalationLevel}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
            </div>
            <Link
              to={`/complaint/${complaint._id}`}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              View Details →
            </Link>
          </div>
        </div>
        
        {complaint.images && complaint.images.length > 0 && (
          <div className="ml-4">
            <img
              src={complaint.images[0].url}
              alt="Complaint"
              className="w-20 h-20 object-cover rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;