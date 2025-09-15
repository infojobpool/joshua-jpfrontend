"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Bell, User, Home, MessageCircle, TrendingUp, Clock, MapPin, DollarSign } from "lucide-react";
import { useIsMobile } from "./MobileWrapper";
import { MobileCard, MobileCardHeader, MobileCardContent } from "./MobileCard";
import { MobileButton } from "./MobileForm";

export function MobileDashboard() {
  const { isMobile } = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Sample tasks data
  const tasks = [
    {
      id: "1",
      title: "Fix Kitchen Sink Leak",
      description: "Need someone to fix a leaky kitchen sink. Water is dripping from under the sink.",
      budget: 75,
      location: "Downtown",
      dueDate: "2024-01-20",
      category: "Plumbing",
      status: "open"
    },
    {
      id: "2", 
      title: "Assemble IKEA Furniture",
      description: "Help assembling a new IKEA bookshelf and desk. All parts included.",
      budget: 50,
      location: "Midtown",
      dueDate: "2024-01-22",
      category: "Assembly",
      status: "open"
    },
    {
      id: "3",
      title: "Pet Sitting for Weekend",
      description: "Need someone to take care of my cat for the weekend while I'm away.",
      budget: 100,
      location: "Uptown",
      dueDate: "2024-01-25",
      category: "Pet Care",
      status: "open"
    }
  ];

  const handleViewDetails = (taskId: string) => {
    console.log("View details for task:", taskId);
  };

  const handleApply = (taskId: string) => {
    console.log("Apply for task:", taskId);
  };

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Mobile Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">JP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">JobPool</h1>
                <p className="text-sm text-gray-500">Welcome back!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Enhanced Search Bar */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                placeholder="Search tasks, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-200"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-4 border-2 rounded-2xl transition-all duration-200 ${
                showFilters 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex space-x-3">
          <MobileButton className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Post a Task
          </MobileButton>
          <MobileButton variant="outline" className="flex-1">
            Browse Tasks
          </MobileButton>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
              <select className="w-full mobile-input">
                <option>All Categories</option>
                <option>Plumbing</option>
                <option>Assembly</option>
                <option>Pet Care</option>
                <option>Cleaning</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Budget Range</label>
              <select className="w-full mobile-input">
                <option>Any Budget</option>
                <option>Under $50</option>
                <option>$50 - $100</option>
                <option>$100 - $200</option>
                <option>Over $200</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MobileCard>
            <MobileCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">Active Tasks</div>
              </div>
            </MobileCardContent>
          </MobileCard>
          <MobileCard>
            <MobileCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </MobileCardContent>
          </MobileCard>
        </div>
      </div>

      {/* Tasks List */}
      <div className="px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Available Tasks</h2>
          <span className="text-sm text-gray-500">{tasks.length} tasks</span>
        </div>
        
        <div className="space-y-4">
          {tasks.map((task) => (
            <MobileCard key={task.id} onClick={() => handleViewDetails(task.id)}>
              <MobileCardHeader>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight flex-1 pr-2">
                    {task.title}
                  </h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {task.status}
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
                </div>

                <div className="mt-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {task.category}
                  </span>
                </div>
              </MobileCardContent>
            </MobileCard>
          ))}
        </div>
      </div>
    </div>
  );
}