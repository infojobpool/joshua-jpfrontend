"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  Zap, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  HardDrive,
  Server
} from "lucide-react";
import { toast } from "sonner";
import {
  clearAllCache,
  clearTaskCache,
  clearUserDataCache,
  smartCacheRefresh,
  getCacheStats,
  autoCleanupOldCache,
  type CacheStats
} from "@/lib/cacheUtils";
import Header from "@/components/Header";

export default function SettingsPage() {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [lastCleared, setLastCleared] = useState<string[]>([]);

  const updateStats = () => {
    const stats = getCacheStats();
    setCacheStats(stats);
  };

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
  useState(() => {
    updateStats();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
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

        {/* Cache Stats Card */}
        {cacheStats && (
          <Card className="mb-6">
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
                    <p className="text-2xl font-bold text-blue-600">{cacheStats.localStorage}</p>
                    <p className="text-xs text-gray-500">items</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-blue-600" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Session Storage</p>
                    <p className="text-2xl font-bold text-green-600">{cacheStats.sessionStorage}</p>
                    <p className="text-xs text-gray-500">items</p>
                  </div>
                  <Server className="h-8 w-8 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Service Worker</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {cacheStats.serviceWorker ? "Active" : "Inactive"}
                    </p>
                    <p className="text-xs text-gray-500">status</p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
    </div>
  );
}

