"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, DollarSign, MapPin, Search, Filter, Star, Loader2 } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "sonner"

export default function BrowseTasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [priceRange, setPriceRange] = useState([0, 500])
  const [location, setLocation] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [myBidTaskIds, setMyBidTaskIds] = useState<Set<string>>(new Set())

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
  }

  interface Category {
    category_id: string;
    category_name: string;
    job_count?: number;
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setIsLoadingTasks(true);
      const response = await axiosInstance.get("/get-all-jobs/");
      if (response.data.status_code === 200) {
        const mappedTasks = response.data.data.jobs.map((job: any) => ({
          id: job.job_id,
          user_ref_id: job.user_ref_id,
          title: job.job_title,
          description: job.job_description,
          budget: job.job_budget,
          location: job.job_location,
          status: job.status,
          deletion_status: job.deletion_status,
          posted_by: job.posted_by,
          dueDate: job.job_due_date,
          category: job.job_category,
          category_name: job.job_category_name,
          job_images: job.job_images,
          postedAt: job.created_at,
          offers: 0, // Default value, can be updated if API provides this
        }));
        setTasks(mappedTasks);
      } else {
        toast.error(response.data.message || "Failed to fetch tasks");
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
          status: true,
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
          status: true,
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
          status: true,
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
          status: true,
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
          status: true,
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
          status: true,
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
      if (response.data.status_code === 200) {
        setCategories(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch categories");
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

    // Filter by category
    const matchesCategory = category === "all" || task.category === category

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

    // Fetch tasks and categories
    fetchTasks()
    fetchCategories()

    // Load my bids initially
    loadMyBidTaskIds()

    // Refresh my bids when tab gains focus (after submitting from task page)
    const onFocus = () => loadMyBidTaskIds()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  // Fix the linting error by adding the proper type to the event parameter
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // In a real app, you would update the URL with search params
    console.log("Searching for:", searchTerm)
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
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{filteredTasks.length} tasks found</p>
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
            </div>

            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
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
                </CardContent>
              </Card>
            ) : isLoadingTasks ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-500">Loading tasks...</span>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge variant="outline">Open</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(task.postedAt)}</span>
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
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{task.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback>{task.posted_by.charAt(0).toUpperCase()}</AvatarFallback>
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
                      <Link href={`/tasks/${task.id}`} className="w-full">
                        <Button className="w-full">View Task</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}