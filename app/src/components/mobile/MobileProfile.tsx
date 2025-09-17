"use client";

import React, { useState } from "react";
import { User, Settings, Bell, Shield, HelpCircle, LogOut, Edit3, Camera } from "lucide-react";
import { useIsMobile } from "./MobileWrapper";
import { MobileCard, MobileCardHeader, MobileCardContent } from "./MobileCard";
import { MobileButton } from "./MobileForm";

export function MobileProfile() {
  const { isMobile } = useIsMobile();
  const [activeTab, setActiveTab] = useState("profile");

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  const profileData = {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    rating: 4.8,
    tasksCompleted: 24,
    memberSince: "Jan 2024",
    bio: "Experienced handyman with 5+ years in home repairs and maintenance. I love helping people solve their problems!"
  };

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-4 py-6">
        <MobileCard className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <MobileCardContent>
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Camera className="h-4 w-4 text-blue-600" />
                </button>
              </div>
              <h2 className="text-2xl font-bold mb-1">{profileData.name}</h2>
              <p className="text-blue-100 mb-3">{profileData.email}</p>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Online
                </div>
                <div className="flex items-center">
                  <span className="font-semibold">{profileData.rating}</span>
                  <span className="ml-1">★</span>
                </div>
              </div>
            </div>
          </MobileCardContent>
        </MobileCard>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <MobileCard>
            <MobileCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{profileData.tasksCompleted}</div>
                <div className="text-sm text-gray-600">Tasks Done</div>
              </div>
            </MobileCardContent>
          </MobileCard>
          <MobileCard>
            <MobileCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{profileData.rating}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </MobileCardContent>
          </MobileCard>
          <MobileCard>
            <MobileCardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{profileData.memberSince}</div>
                <div className="text-sm text-gray-600">Member</div>
              </div>
            </MobileCardContent>
          </MobileCard>
        </div>
      </div>

      {/* Profile Details */}
      <div className="px-4 pb-4">
        <MobileCard>
          <MobileCardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">About</h3>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Edit3 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </MobileCardHeader>
          <MobileCardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Bio</label>
                <p className="text-gray-900 mt-1">{profileData.bio}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-gray-900 mt-1">{profileData.location}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900 mt-1">{profileData.phone}</p>
              </div>
            </div>
          </MobileCardContent>
        </MobileCard>
      </div>

      {/* Menu Items */}
      <div className="px-4 pb-20">
        <MobileCard>
          <MobileCardContent>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 text-red-600">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </MobileCardContent>
        </MobileCard>
      </div>
    </div>
  );
}


