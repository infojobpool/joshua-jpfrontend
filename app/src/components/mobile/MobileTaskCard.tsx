"use client";

import React from "react";
import { Clock, MapPin, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  dueDate: string;
  category: string;
  postedBy: string;
  status: string;
}

interface MobileTaskCardProps {
  task: Task;
  onViewDetails: (taskId: string) => void;
  onApply: (taskId: string) => void;
}

export function MobileTaskCard({ task, onViewDetails, onApply }: MobileTaskCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days left`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-4">
      {/* Header with status */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight flex-1 pr-2">
            {task.title}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
          {task.description}
        </p>
      </div>

      {/* Task details */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="h-4 w-4 mr-2 text-green-600" />
          <span className="font-semibold text-green-600">${task.budget}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span className="truncate">{task.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-2" />
          <span>Posted by {task.postedBy}</span>
        </div>
      </div>

      {/* Category badge */}
      <div className="px-4 pb-3">
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
          {task.category}
        </span>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
          onClick={() => onViewDetails(task.id)}
        >
          View Details
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={() => onApply(task.id)}
        >
          Apply Now
        </Button>
      </div>
    </div>
  );
}



