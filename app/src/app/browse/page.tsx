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
import { Clock, DollarSign, MapPin, Search, Filter, Star } from "lucide-react"

export default function BrowseTasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [priceRange, setPriceRange] = useState([0, 500])
  const [location, setLocation] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Define task interface for type safety
  interface Task {
    id: string;
    title: string;
    description: string;
    budget: number;
    location: string;
    status: string;
    postedAt: string;
    category: string;
    poster: {
      name: string;
      rating: number;
    };
    offers: number;
  }

  // Mock tasks data
  const allTasks: Task[] = [
    {
      id: "task1",
      title: "Help with moving furniture",
      description: "Need help moving a couch and a few boxes from my apartment to my new place.",
      budget: 50,
      location: "Brooklyn, NY",
      status: "open",
      postedAt: "2 days ago",
      category: "delivery",
      poster: {
        name: "Alex J.",
        rating: 4.8,
      },
      offers: 3,
    },
    {
      id: "task2",
      title: "Fix leaky faucet",
      description: "Kitchen faucet is leaking and needs to be fixed or replaced.",
      budget: 75,
      location: "Queens, NY",
      status: "open",
      postedAt: "1 week ago",
      category: "handyman",
      poster: {
        name: "Sarah M.",
        rating: 4.5,
      },
      offers: 5,
    },
    {
      id: "task3",
      title: "Website debugging",
      description: "Need help fixing some bugs on my WordPress website.",
      budget: 120,
      location: "Remote",
      status: "open",
      postedAt: "3 hours ago",
      category: "tech",
      poster: {
        name: "Mike T.",
        rating: 4.9,
      },
      offers: 2,
    },
    {
      id: "task4",
      title: "Dog walking",
      description: "Need someone to walk my dog for the next 3 days while I'm away.",
      budget: 60,
      location: "Manhattan, NY",
      status: "open",
      postedAt: "1 day ago",
      category: "home",
      poster: {
        name: "Emma S.",
        rating: 4.7,
      },
      offers: 4,
    },
    {
      id: "task5",
      title: "Grocery delivery",
      description: "Need someone to pick up groceries from the store and deliver to my home.",
      budget: 30,
      location: "Bronx, NY",
      status: "open",
      postedAt: "5 hours ago",
      category: "delivery",
      poster: {
        name: "Robert J.",
        rating: 4.6,
      },
      offers: 1,
    },
    {
      id: "task6",
      title: "Lawn mowing",
      description: "Need lawn mowed and edges trimmed.",
      budget: 45,
      location: "Staten Island, NY",
      status: "open",
      postedAt: "3 days ago",
      category: "home",
      poster: {
        name: "Lisa K.",
        rating: 4.8,
      },
      offers: 2,
    },
    {
      id: "task7",
      title: "Computer setup",
      description: "Help setting up new computer and transferring files.",
      budget: 80,
      location: "Remote",
      status: "open",
      postedAt: "2 days ago",
      category: "tech",
      poster: {
        name: "David W.",
        rating: 4.9,
      },
      offers: 3,
    },
    {
      id: "task8",
      title: "House cleaning",
      description: "Need a thorough cleaning of my 2-bedroom apartment.",
      budget: 100,
      location: "Brooklyn, NY",
      status: "open",
      postedAt: "1 day ago",
      category: "cleaning",
      poster: {
        name: "Jennifer L.",
        rating: 4.7,
      },
      offers: 6,
    },
  ]

  // Filter tasks based on search and filters
  const filteredTasks = allTasks.filter((task) => {
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
  }, [])

  // Fix the linting error by adding the proper type to the event parameter
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // In a real app, you would update the URL with search params
    console.log("Searching for:", searchTerm)
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">JobPool</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/post-task" className="text-sm font-medium hover:underline underline-offset-4">
              Post a Task
            </Link>
            {/* <Link href="/messages" className="text-sm font-medium hover:underline underline-offset-4">
              Messages
            </Link> */}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
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
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="delivery">Delivery & Moving</SelectItem>
                      <SelectItem value="handyman">Handyman</SelectItem>
                      <SelectItem value="tech">Tech & IT</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
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
                        <SelectItem value="home">Home & Garden</SelectItem>
                        <SelectItem value="delivery">Delivery & Moving</SelectItem>
                        <SelectItem value="handyman">Handyman</SelectItem>
                        <SelectItem value="tech">Tech & IT</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
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
                        <span>{task.postedAt}</span>
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
                            <AvatarFallback>{task.poster.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{task.poster.name}</span>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs ml-0.5">{task.poster.rating}</span>
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