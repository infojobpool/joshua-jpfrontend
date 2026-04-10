"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/lib/Zustand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  Zap, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  HardDrive,
  Server,
  UserX
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";
import {
  clearAllCache,
  clearTaskCache,
  smartCacheRefresh,
  getCacheStats,
  autoCleanupOldCache,
  type CacheStats
} from "@/lib/cacheUtils";
import Header from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import {
  readOfferingSubscriptionMock,
  setOfferingSubscriptionMock,
} from "@/lib/offerings/storage";

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, userId, user, logout } = useStore();
  const [isClearing, setIsClearing] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [lastCleared, setLastCleared] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [offeringSubMock, setOfferingSubMock] = useState(false);

  useEffect(() => {
    setOfferingSubMock(readOfferingSubscriptionMock());
  }, []);

  const handleSignOut = () => {
    logout();
    router.push("/signin");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm account deletion");
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Call backend API to delete account
      const response = await axiosInstance.delete(`/delete-account/${userId}/`);
      
      if (response.data.status_code === 200 || response.status === 200) {
        toast.success("Account deleted successfully");
        
        // Clear all local data
        await clearAllCache();
        
        // Logout and redirect
        logout();
        
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      } else {
        toast.error(response.data.message || "Failed to delete account");
      }
    } catch (error: any) {
      console.error("Account deletion error:", error);
      
      // If endpoint doesn't exist, show a message with link to contact support
      if (error.response?.status === 404) {
        toast.error("Account deletion is not yet available. Please contact support to delete your account.", {
          duration: 8000,
          action: {
            label: "Contact Support",
            onClick: () => {
              window.open("mailto:support@jobpool.in?subject=Account Deletion Request", "_blank");
            },
          },
        });
      } else {
        toast.error(error.response?.data?.message || "Failed to delete account. Please contact support.");
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteConfirmText("");
    }
  };

  // Check authentication
  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated && !userId) {
      router.push("/signin?redirect=/settings");
    }
  }, [isAuthenticated, userId, router]);

  const updateStats = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stats = getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error("Failed to update cache stats:", error);
      // Set default stats on error
      setCacheStats({
        localStorage: 0,
        sessionStorage: 0,
        serviceWorker: false,
        cleared: [],
      });
    }
  }, []);

  const handleClearAll = async () => {
    if (!confirm("This will clear ALL app data including login session. You'll need to log in again. Continue?")) {
      return;
    }

    setIsClearing(true);
    try {
      const stats = await clearAllCache();
      setLastCleared(stats.cleared);
      updateStats();
      toast.success(`Cleared ${stats.localStorage + stats.sessionStorage} cache items!`, {
        description: "All app data has been cleared. Redirecting to login...",
      });
      
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (error) {
      console.error("Cache clear error:", error);
      toast.error("Failed to clear cache");
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearTaskCache = () => {
    setIsClearing(true);
    try {
      const cleared = clearTaskCache();
      setLastCleared(cleared);
      updateStats();
      toast.success(`Cleared ${cleared.length} task cache items!`, {
        description: "Task data refreshed. Reload to see latest.",
      });
    } catch (error) {
      console.error("Task cache clear error:", error);
      toast.error("Failed to clear task cache");
    } finally {
      setIsClearing(false);
    }
  };

  const handleSmartRefresh = () => {
    setIsClearing(true);
    try {
      const cleared = smartCacheRefresh();
      setLastCleared(cleared);
      updateStats();
      toast.success(`Smart refresh complete! Cleared ${cleared.length} stale items.`, {
        description: "Kept your login, cleared old data.",
      });
      
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Smart refresh error:", error);
      toast.error("Failed to refresh cache");
    } finally {
      setIsClearing(false);
    }
  };

  const handleAutoCleanup = () => {
    setIsClearing(true);
    try {
      const cleared = autoCleanupOldCache(7 * 24 * 60 * 60 * 1000); // 7 days
      setLastCleared(cleared);
      updateStats();
      
      if (cleared.length > 0) {
        toast.success(`Removed ${cleared.length} old cache entries!`, {
          description: "Cache optimized automatically.",
        });
      } else {
        toast.info("Cache is already clean!", {
          description: "No old entries found.",
        });
      }
    } catch (error) {
      console.error("Auto cleanup error:", error);
      toast.error("Failed to cleanup cache");
    } finally {
      setIsClearing(false);
    }
  };

  // Load stats on mount
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    // Initial stats load
    updateStats();
    
    // Also update stats periodically
    const interval = setInterval(() => {
      try {
        updateStats();
      } catch (error) {
        console.error("Error updating stats:", error);
      }
    }, 5000);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mounted, updateStats]);

  // Show loading state until mounted (prevents SSR issues)
  if (!mounted || (!isAuthenticated && !userId)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">
            {!mounted ? "Loading settings..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

  // Prepare user data for Header
  const headerUser = user ? {
    name: user.name || "User",
    avatar: user.profile_image || "",
  } : {
    name: "User",
    avatar: "",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={headerUser} onSignOut={handleSignOut} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900">App Settings</h1>
            <p className="text-gray-600 mt-2">Manage cache, storage, and performance</p>
          </div>
        </div>

        {process.env.NODE_ENV === "development" && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-lg">Developer — profile offerings</CardTitle>
              <CardDescription>
                Simulate a paid plan (more listing slots). Uses localStorage only; replace with real subscription when the API is ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <Label htmlFor="offering-sub-mock" className="text-sm font-normal cursor-pointer">
                Mock &quot;subscription&quot; active
              </Label>
              <Switch
                id="offering-sub-mock"
                checked={offeringSubMock}
                onCheckedChange={(v) => {
                  setOfferingSubscriptionMock(v);
                  setOfferingSubMock(v);
                  toast.success(v ? "Mock subscription on (up to 25 slots)" : "Mock subscription off (2 slots)");
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Cache Stats Card */}
        <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache Statistics
            </CardTitle>
            <CardDescription>Current storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Local Storage</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {cacheStats?.localStorage ?? 0}
                  </p>
                  <p className="text-xs text-gray-500">items</p>
                </div>
                <HardDrive className="h-8 w-8 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Session Storage</p>
                  <p className="text-2xl font-bold text-green-600">
                    {cacheStats?.sessionStorage ?? 0}
                  </p>
                  <p className="text-xs text-gray-500">items</p>
                </div>
                <Server className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Service Worker</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {cacheStats?.serviceWorker ? "Active" : "Inactive"}
                  </p>
                  <p className="text-xs text-gray-500">status</p>
                </div>
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Management Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Smart Refresh */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Smart Refresh
              </CardTitle>
              <CardDescription>
                Clears stale data while keeping your login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSmartRefresh}
                disabled={isClearing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Smart Refresh
                  </>
                )}
              </Button>
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Recommended for better performance</span>
              </div>
            </CardContent>
          </Card>

          {/* Clear Task Cache */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-green-600" />
                Clear Task Data
              </CardTitle>
              <CardDescription>
                Refresh tasks, bids, and job listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleClearTaskCache}
                disabled={isClearing}
                variant="outline"
                className="w-full"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Clear Task Cache
                  </>
                )}
              </Button>
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Keeps login and profile data</span>
              </div>
            </CardContent>
          </Card>

          {/* Auto Cleanup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-purple-600" />
                Auto Cleanup
              </CardTitle>
              <CardDescription>
                Remove old cache entries (7+ days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleAutoCleanup}
                disabled={isClearing}
                variant="outline"
                className="w-full"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Run Cleanup
                  </>
                )}
              </Button>
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
                <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>Optimize storage automatically</span>
              </div>
            </CardContent>
          </Card>

          {/* Clear All Cache */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <Trash2 className="h-5 w-5" />
                Clear All Data
              </CardTitle>
              <CardDescription>
                Complete reset - requires re-login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleClearAll}
                disabled={isClearing}
                variant="destructive"
                className="w-full"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Cache
                  </>
                )}
              </Button>
              <div className="mt-3 flex items-start gap-2 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Warning: You will be logged out</span>
              </div>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-300 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                <UserX className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription className="text-red-600">
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowDeleteAccountDialog(true)}
                disabled={isDeletingAccount}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <UserX className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
              <div className="mt-3 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>This action cannot be undone. All your data will be permanently deleted.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Cleared Info */}
        {lastCleared.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Cache Cleared Successfully
              </CardTitle>
              <CardDescription className="text-green-600">
                {lastCleared.length} items removed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  {lastCleared.length} items cleared
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLastCleared([])}
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">What will be deleted:</p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>Your profile and personal information</li>
                <li>All your posted tasks</li>
                <li>All your bids and offers</li>
                <li>Your message history</li>
                <li>Your reviews and ratings</li>
                <li>All associated data</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </Label>
              <Input
                id="deleteConfirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="border-red-200 focus:border-red-500 focus:ring-red-500"
                disabled={isDeletingAccount}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteAccountDialog(false);
                setDeleteConfirmText("");
              }}
              disabled={isDeletingAccount}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isDeletingAccount ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Delete Account Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

