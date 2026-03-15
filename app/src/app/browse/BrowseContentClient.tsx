"use client"

import React, { Component, useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, DollarSign, MapPin, Search, Filter, Star, Loader2, MapPinOff } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { formatDateWithTime } from "@/lib/utils"
import { storeTaskForNav, prefetchBidsForTask } from "@/lib/taskNavCache"
import { toast } from "sonner"

class BrowseErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; retryKey: number; error: Error | null }
> {
  state = { hasError: false, retryKey: 0, error: null as Error | null }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error })
    if (process.env.NODE_ENV === "development" || typeof window !== "undefined") {
      console.error("[Browse] Error:", error?.message, error?.stack, errorInfo)
    }
  }
  handleRetry = () => {
    this.setState((s) => ({ hasError: false, retryKey: s.retryKey + 1, error: null }))
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 gap-4">
          <p className="text-muted-foreground text-center">Unable to load tasks. Please try again.</p>
          {this.state.error && (
            <p className="text-xs text-amber-600/80 max-w-md text-center font-mono break-all">
              {this.state.error.message}
            </p>
          )}
          <Button onClick={this.handleRetry} variant="outline">
            Try again
          </Button>
          <Link href="/">
            <Button variant="ghost">Go home</Button>
          </Link>
        </div>
      )
    }
    return <div key={this.state.retryKey}>{this.props.children}</div>
  }
}

function TaskCardWithPrefetch({
  task,
  index,
  prefetchBidsForTask,
  storeTaskForNav,
  prefetchFirstN,
}: {
  task: any;
  index: number;
  prefetchBidsForTask: (id: string) => void;
  storeTaskForNav: (t: any) => void;
  prefetchFirstN: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cardRef.current || !task?.id) return;
    const el = cardRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          try { prefetchBidsForTask(task.id); } catch {}
        }
      },
      { threshold: 0.25, rootMargin: "50px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [task?.id, prefetchBidsForTask]);
  useEffect(() => {
    if (index < prefetchFirstN) {
      try { prefetchBidsForTask(task.id); } catch {}
    }
  }, [index, prefetchFirstN, task?.id]);
  return (
    <div ref={cardRef}>
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <Badge variant="outline">Open</Badge>
        </div>
        <CardDescription className="flex items-center gap-2 flex-wrap">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Posted {formatDateWithTime(task.postedAt)}</span>
          {task.dueDate && (
            <>
              <span className="text-muted-foreground">•</span>
              <span>Due {formatDateWithTime(task.dueDate)}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{task.description}</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${task.budget}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{task.location}</span>
            {typeof task.distance_km === "number" && (
              <Badge variant="secondary" className="text-xs font-normal">~{task.distance_km.toFixed(1)} km away</Badge>
            )}
          </div>
          {task.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-1"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              Open in Google Maps
            </a>
          )}
          <div className="flex items-center gap-2">
            <Avatar className="h-4 w-4">
              <AvatarFallback>{task.posted_by?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{task.posted_by}</span>
            <div className="flex items-center">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs ml-0.5">4.5</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={`/tasks/${task.id}`}
          className="w-full"
          onClick={() => { try { storeTaskForNav({ ...task, posted_by_id: task.user_ref_id, images: task.job_images?.urls?.map((url: string, i: number) => ({ id: `img${i+1}`, url, alt: `Image ${i+1}` })) }); } catch {} }}
          onMouseEnter={() => { try { prefetchBidsForTask(task.id); } catch {} }}
          onTouchStart={() => { try { prefetchBidsForTask(task.id); } catch {} }}
        >
          <Button className="w-full">View Task</Button>
        </Link>
      </CardFooter>
    </Card>
    </div>
  );
}

// Use native <select> on mobile to avoid Radix Portal crashes in WebView/PWA (see Radix #2673, #1681)
const isMobileView = () => typeof window !== "undefined" && window.innerWidth < 768

// Native <select> works reliably on mobile WebViews; Radix Select uses Portals which can crash
const isMobileViewport = () => typeof window !== "undefined" && window.innerWidth < 768

function BrowseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  // Use native select on mobile from first paint to avoid Radix Portal crash (initial state, not useEffect)
  const useNativeSelect = isMobileViewport()

  useEffect(() => {
    try {
      const cat = searchParams?.get?.("category")
      if (cat) setCategory(cat)
    } catch (_) {}
  }, [searchParams])
  const [priceRange, setPriceRange] = useState([0, 500])
  const [location, setLocation] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [myBidTaskIds, setMyBidTaskIds] = useState<Set<string>>(new Set())
  const [nearMeMode, setNearMeMode] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [nearMeError, setNearMeError] = useState<string | null>(null)
  const [radiusKm, setRadiusKm] = useState(10)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)

  // Define task interface for type safety
  interface Task {
    id: string;
    user_ref_id?: string;
    title: string;
    description: string;
    budget: number;
    location: string;
    status: boolean;
    deletion_status?: boolean;
    postedAt: string;
    category: string;
    category_name: string;
    posted_by: string;
    dueDate?: string;
    job_images?: { urls: string[] };
    offers?: number;
    distance_km?: number;
    latitude?: number;
    longitude?: number;
  }

  interface Category {
    category_id: string;
    category_name: string;
    job_count?: number;
  }

  const mapJobToTask = (job: any): Task => {
    if (!job || typeof job !== "object") return null as any;
    return ({
    id: job.job_id,
    user_ref_id: job.user_ref_id,
    title: job.job_title,
    description: job.job_description,
    budget: job.job_budget,
    location: job.job_location,
    status: job.status,
    deletion_status: job.deletion_status,
    posted_by: job.posted_by,
    dueDate: job.job_due_date || undefined,
    category: job.job_category,
    category_name: job.job_category_name,
    job_images: job.job_images,
    postedAt: job.created_at || job.timestamp || job.job_due_date || "",
    offers: 0,
    distance_km: typeof job.distance_km === "number" ? job.distance_km : undefined,
    latitude: typeof job.latitude === "number" ? job.latitude : undefined,
    longitude: typeof job.longitude === "number" ? job.longitude : undefined,
  });
  };

  // Fetch tasks from API – jobs-nearby when Near me mode + coords, else get-all-jobs
  const fetchTasks = async (coords?: { lat: number; lng: number } | null) => {
    try {
      setIsLoadingTasks(true);
      setNearMeError(null);

      if (nearMeMode && coords) {
        try {
          const response = await axiosInstance.get("/jobs-nearby/", {
            params: { lat: coords.lat, lng: coords.lng, radius_km: radiusKm, limit: 100 },
          });
          if (response.data?.status_code === 200) {
            const jobs = response.data?.data?.jobs ?? [];
            const mappedTasks = (Array.isArray(jobs) ? jobs : []).map(mapJobToTask);
            setTasks(mappedTasks);
            return;
          }
          // Non-200: turn off Near me and fall back (matches FRONTEND_API_BROWSE.md)
          setNearMeMode(false);
          setUserCoords(null);
          setNearMeError("Nearby search unavailable, showing all tasks");
          toast.error("Could not get your location. Showing all tasks.");
        } catch (err) {
          console.warn("jobs-nearby failed, falling back to get-all-jobs:", err);
          setNearMeMode(false);
          setUserCoords(null);
          setNearMeError("Nearby search unavailable, showing all tasks");
          toast.error("Could not get your location. Showing all tasks.");
        }
      }

      const response = await axiosInstance.get("/get-all-jobs/");
      const data = response?.data;
      if (data?.status_code === 200) {
        const raw = data?.data?.jobs ?? [];
        const jobs = Array.isArray(raw) ? raw : [];
        const mappedTasks = jobs.map((j: any) => {
          try { return mapJobToTask(j); } catch { return null; }
        }).filter(Boolean);
        setTasks(mappedTasks);
      } else {
        toast.error(data?.message || "Failed to fetch tasks");
      }
    } catch (error) {
      console.log("API not available, using sample tasks");
      // Fallback to sample tasks when API is not available
      const sampleTasks: Task[] = [
        {
          id: "sample1",
          title: "Help with moving furniture",
          description: "Need help moving a couch and a few boxes from my apartment to my new place.",
          budget: 50,
          location: "Brooklyn, NY",
          status: false,
          postedAt: "2024-01-15T10:00:00Z",
          category: "home",
          category_name: "Home & Garden",
          posted_by: "Alex J.",
        },
        {
          id: "sample2",
          title: "Fix leaky faucet",
          description: "Kitchen faucet is leaking and needs to be fixed or replaced.",
          budget: 75,
          location: "Queens, NY",
          status: false,
          postedAt: "2024-01-14T14:30:00Z",
          category: "plumbing",
          category_name: "Plumbing",
          posted_by: "Sarah M.",
        },
        {
          id: "sample3",
          title: "Website debugging",
          description: "Need help fixing some bugs on my WordPress website.",
          budget: 120,
          location: "Remote",
          status: false,
          postedAt: "2024-01-13T09:15:00Z",
          category: "tech",
          category_name: "Technology",
          posted_by: "Mike T.",
        },
        {
          id: "sample4",
          title: "Dog walking",
          description: "Need someone to walk my dog twice a day for a week.",
          budget: 200,
          location: "Manhattan, NY",
          status: false,
          postedAt: "2024-01-12T16:45:00Z",
          category: "pet",
          category_name: "Pet Care",
          posted_by: "Emma R.",
        },
        {
          id: "sample5",
          title: "Garden cleanup",
          description: "Need help cleaning up my backyard garden and trimming bushes.",
          budget: 80,
          location: "Bronx, NY",
          status: false,
          postedAt: "2024-01-11T11:20:00Z",
          category: "home",
          category_name: "Home & Garden",
          posted_by: "John D.",
        },
        {
          id: "sample6",
          title: "House cleaning",
          description: "Need a thorough cleaning of my 2-bedroom apartment.",
          budget: 100,
          location: "Brooklyn, NY",
          status: false,
          postedAt: "2024-01-10T13:00:00Z",
          category: "cleaning",
          category_name: "Cleaning",
          posted_by: "Jennifer L.",
        },
      ];
      setTasks(sampleTasks);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Load user's bid task ids from localStorage
  const loadMyBidTaskIds = () => {
    try {
      const stored = localStorage.getItem("bids")
      const userRaw = localStorage.getItem("user")
      const currentUserId = userRaw ? (JSON.parse(userRaw)?.id?.toString() || "") : ""
      if (stored && currentUserId) {
        const bids: Array<{ job_id: string; bidder_id?: string | number }> = JSON.parse(stored)
        const mine = bids.filter(b => (b.bidder_id !== undefined ? String(b.bidder_id) === currentUserId : true))
        const ids = new Set<string>(mine.map(b => String(b.job_id)))
        setMyBidTaskIds(ids)
      } else {
        setMyBidTaskIds(new Set())
      }
    } catch (_) {
      setMyBidTaskIds(new Set())
    }
  }

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("get-all-categories/");
      const data = response?.data;
      if (data?.status_code === 200) {
        const raw = data?.data?.categories ?? data?.data ?? data?.categories ?? data;
        const list = Array.isArray(raw) ? raw : [];
        setCategories(list);
      } else {
        toast.error(data?.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.log("Categories API not available, using sample categories");
      // Fallback to sample categories when API is not available
      const sampleCategories: Category[] = [
        { category_id: "home", category_name: "Home & Garden" },
        { category_id: "plumbing", category_name: "Plumbing" },
        { category_id: "tech", category_name: "Technology" },
        { category_id: "pet", category_name: "Pet Care" },
        { category_id: "cleaning", category_name: "Cleaning" },
        { category_id: "delivery", category_name: "Delivery & Moving" },
        { category_id: "handyman", category_name: "Handyman" },
      ];
      setCategories(sampleCategories);
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    // Only show active tasks that are not deleted
    if (task.deletion_status || !task.status) return false;

    // Hide tasks I already bid on
    if (myBidTaskIds.has(String(task.id))) return false

    // Filter by search term
    const matchesSearch =
      searchTerm === "" ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by category (URL param is string; API may return category as number or string)
    const matchesCategory = category === "all" || String(task.category) === String(category)

    // Filter by price range
    const matchesPrice = task.budget >= priceRange[0] && task.budget <= priceRange[1]

    // Filter by location
    const matchesLocation = location === "" || task.location.toLowerCase().includes(location.toLowerCase())

    return matchesSearch && matchesCategory && matchesPrice && matchesLocation
  })

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)

    fetchCategories()
    loadMyBidTaskIds()

    const onFocus = () => loadMyBidTaskIds()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  useEffect(() => {
    fetchTasks(nearMeMode ? userCoords : null)
  }, [nearMeMode, userCoords, radiusKm])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  const handleNearMeToggle = () => {
    if (nearMeMode) {
      setNearMeMode(false)
      setUserCoords(null)
      setNearMeError(null)
      return
    }
    if (typeof navigator?.geolocation?.getCurrentPosition !== "function") {
      toast.error("Geolocation is not supported by your browser")
      return
    }
    setIsRequestingLocation(true)
    setNearMeError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setNearMeMode(true)
        setIsRequestingLocation(false)
      },
      () => {
        toast.error("Could not get your location. Showing all tasks.")
        setNearMeError("Location denied or unavailable")
        setIsRequestingLocation(false)
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: true }
    )
  }


  return (
    <div className="min-h-screen">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JP</span>
              </div>
              <span className="text-xl font-bold text-gray-900">JobPool</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/browse" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Browse Tasks
              </Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
                How It Works
              </Link>
              <Link href="/categories" className="text-gray-600 hover:text-blue-600 transition-colors">
                Categories
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/signin" className="text-gray-600 hover:text-blue-600 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 md:py-10 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Browse Tasks</h1>
          <p className="text-muted-foreground">Find tasks that match your skills and availability</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
                <CardDescription>Refine your search</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  {useNativeSelect ? (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <div className="pt-4">
                    <Slider
                      defaultValue={[0, 500]}
                      max={500}
                      step={10}
                      value={priceRange}
                      onValueChange={setPriceRange}
                    />
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input placeholder="Any location" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Near me</label>
                    <Button
                      type="button"
                      variant={nearMeMode ? "default" : "outline"}
                      size="sm"
                      onClick={handleNearMeToggle}
                      disabled={isRequestingLocation}
                    >
                      {isRequestingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : nearMeMode ? (
                        <MapPin className="h-4 w-4 mr-1" />
                      ) : (
                        <MapPinOff className="h-4 w-4 mr-1" />
                      )}
                      {isRequestingLocation ? "Getting location…" : nearMeMode ? "On" : "Off"}
                    </Button>
                  </div>
                  {nearMeMode && (
                    useNativeSelect ? (
                      <select
                        value={String(radiusKm)}
                        onChange={(e) => setRadiusKm(Number(e.target.value))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        <option value="5">5 km</option>
                        <option value="10">10 km</option>
                        <option value="25">25 km</option>
                        <option value="50">50 km</option>
                      </select>
                    ) : (
                      <Select value={String(radiusKm)} onValueChange={(v) => setRadiusKm(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 km</SelectItem>
                          <SelectItem value="10">10 km</SelectItem>
                          <SelectItem value="25">25 km</SelectItem>
                          <SelectItem value="50">50 km</SelectItem>
                        </SelectContent>
                      </Select>
                    )
                  )}
                  {nearMeError && <p className="text-xs text-amber-600">{nearMeError}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search tasks..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
              <Button variant="outline" className="sm:hidden" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <Card className="sm:hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    {useNativeSelect ? (
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.category_id} value={cat.category_id}>
                              {cat.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <div className="pt-4">
                      <Slider
                        defaultValue={[0, 500]}
                        max={500}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                      />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input placeholder="Any location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Near me</label>
                      <Button
                        type="button"
                        variant={nearMeMode ? "default" : "outline"}
                        size="sm"
                        onClick={handleNearMeToggle}
                        disabled={isRequestingLocation}
                      >
                        {isRequestingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : nearMeMode ? <MapPin className="h-4 w-4 mr-1" /> : <MapPinOff className="h-4 w-4 mr-1" />}
                        {isRequestingLocation ? "Getting location…" : nearMeMode ? "On" : "Off"}
                      </Button>
                    </div>
                    {nearMeMode && (
                      useNativeSelect ? (
                        <select
                          value={String(radiusKm)}
                          onChange={(e) => setRadiusKm(Number(e.target.value))}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        >
                          <option value="5">5 km</option>
                          <option value="10">10 km</option>
                          <option value="25">25 km</option>
                          <option value="50">50 km</option>
                        </select>
                      ) : (
                        <Select value={String(radiusKm)} onValueChange={(v) => setRadiusKm(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 km</SelectItem>
                            <SelectItem value="10">10 km</SelectItem>
                            <SelectItem value="25">25 km</SelectItem>
                            <SelectItem value="50">50 km</SelectItem>
                          </SelectContent>
                        </Select>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{filteredTasks.length} tasks found</p>
              {useNativeSelect ? (
                <select
                  defaultValue="newest"
                  className="flex h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest budget</option>
                  <option value="lowest">Lowest budget</option>
                </select>
              ) : (
                <Select defaultValue="newest">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="highest">Highest budget</SelectItem>
                    <SelectItem value="lowest">Lowest budget</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  {nearMeMode ? (
                    <>
                      <p className="text-muted-foreground mb-4">No tasks nearby within {radiusKm} km</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button variant="outline" onClick={() => setRadiusKm(Math.min(50, radiusKm * 2))}>
                          Widen radius
                        </Button>
                        <Button variant="secondary" onClick={() => { setNearMeMode(false); setUserCoords(null); }}>
                          Show all tasks
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-4">No tasks found matching your criteria</p>
                      <Button
                        onClick={() => {
                          setSearchTerm("")
                          setCategory("all")
                          setPriceRange([0, 500])
                          setLocation("")
                        }}
                      >
                        Clear Filters
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : isLoadingTasks ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-500">Loading tasks...</span>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((task, index) => (
                  <TaskCardWithPrefetch key={task.id} task={task} index={index} prefetchBidsForTask={prefetchBidsForTask} storeTaskForNav={storeTaskForNav} prefetchFirstN={5} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function BrowseContentClient() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <BrowseErrorBoundary>
        <BrowseContent />
      </BrowseErrorBoundary>
    </Suspense>
  )
}