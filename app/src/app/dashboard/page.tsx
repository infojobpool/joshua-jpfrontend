"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Simple authentication check
    const token = localStorage.getItem("token");
    if (!token) {
        router.push("/signin");
        return;
      }

    // Get user info from localStorage
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUserName(user.name || "User");
      } catch (error) {
        console.error("Error parsing user info:", error);
      }
    }

        setLoading(false);
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    router.push("/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">JobPool Dashboard</h1>
          </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {userName}</span>
                <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                Sign Out
                </button>
              </div>
                </div>
                </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard Loaded Successfully! 🎉
              </h2>
              <p className="text-gray-600 mb-4">
                This is a minimal working dashboard to test React error #130
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✅ No complex components</p>
                <p>✅ No Zustand store</p>
                <p>✅ No UI library components</p>
                <p>✅ Basic authentication check</p>
      </div>
                </div>
                  </div>
                  </div>
      </main>
    </div>
  );
}