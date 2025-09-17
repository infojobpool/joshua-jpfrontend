"use client";

import React from "react";
import { useIsMobile } from "./MobileWrapper";

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function MobileCard({ children, className = "", onClick, hover = true }: MobileCardProps) {
  const { isMobile } = useIsMobile();

  return (
    <div
      onClick={onClick}
      className={`
        ${isMobile ? 'mobile-card' : 'bg-white rounded-lg shadow-sm border border-gray-200'}
        ${onClick ? 'cursor-pointer' : ''}
        ${hover && onClick ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface MobileCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardHeader({ children, className = "" }: MobileCardHeaderProps) {
  const { isMobile } = useIsMobile();

  return (
    <div className={`${isMobile ? 'p-4 pb-3' : 'p-6 pb-4'} ${className}`}>
      {children}
    </div>
  );
}

interface MobileCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardContent({ children, className = "" }: MobileCardContentProps) {
  const { isMobile } = useIsMobile();

  return (
    <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'} ${className}`}>
      {children}
    </div>
  );
}

interface MobileCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardFooter({ children, className = "" }: MobileCardFooterProps) {
  const { isMobile } = useIsMobile();

  return (
    <div className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'} ${className}`}>
      {children}
    </div>
  );
}

// Mobile-specific task card
interface MobileTaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    budget: number;
    location: string;
    dueDate: string;
    category: string;
    status: string;
  };
  onViewDetails: (taskId: string) => void;
  onApply?: (taskId: string) => void;
}

export function MobileTaskCard({ task, onViewDetails, onApply }: MobileTaskCardProps) {
  const { isMobile } = useIsMobile();

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

  if (!isMobile) {
    // Return regular card for desktop
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4">{task.description}</p>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-green-600">${task.budget}</span>
          <button
            onClick={() => onViewDetails(task.id)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    );
  }

  // Mobile-optimized card
  return (
    <MobileCard onClick={() => onViewDetails(task.id)}>
      <MobileCardHeader>
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
      </MobileCardHeader>

      <MobileCardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="font-semibold text-green-600">${task.budget}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{task.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDate(task.dueDate)}</span>
          </div>
        </div>

        <div className="mt-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {task.category}
          </span>
        </div>
      </MobileCardContent>

      {onApply && (
        <MobileCardFooter>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(task.id);
              }}
              className="flex-1 text-blue-600 border border-blue-600 hover:bg-blue-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply(task.id);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Apply Now
            </button>
          </div>
        </MobileCardFooter>
      )}
    </MobileCard>
  );
}


