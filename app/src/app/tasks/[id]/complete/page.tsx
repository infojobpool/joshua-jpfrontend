
// "use client"

// import { useState, useEffect, use } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Textarea } from "@/components/ui/textarea"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { toast } from "sonner"
// import { CheckCircle, Upload, AlertCircle } from "lucide-react"
// import axiosInstance from "@/lib/axiosInstance"
// import useStore from "@/lib/Zustand"

// interface UserType {
//   id: string
//   name: string
//   email: string
// }

// interface TaskCompletionParams {
//   params: {
//     id: string
//   }
// }

// interface ImageType {
//   id: string
//   name: string
//   url: string
//   file: File
// }

// interface CompletionDetailsType {
//   notes: string
//   status: string
//   images: ImageType[]
// }


// interface TaskDetailPageProps {
//   params: Promise<{ id: string }>;
// }



// export default function CompleteTaskPage({ params }: TaskDetailPageProps) {
//   const router = useRouter()
//   const { id } = use(params);
//   const { userId } = useStore()
//   const [user, setUser] = useState<UserType | null>(null)
//   const [loading, setLoading] = useState<boolean>(true)
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
//   const [completionDetails, setCompletionDetails] = useState<CompletionDetailsType>({
//     notes: "",
//     status: "completed",
//     images: [],
//   })

//   useEffect(() => {
//     // Check if user is logged in
//     const storedUser = localStorage.getItem("user")
//     if (storedUser) {
//       setUser(JSON.parse(storedUser))
//     } else {
//       // Redirect to sign in if not logged in
//       router.push("/signin")
//     }
//     setLoading(false)
//   }, [router])

//   const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const { name, value } = e.target
//     setCompletionDetails((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleRadioChange = (value: string) => {
//     setCompletionDetails((prev) => ({ ...prev, status: value }))
//   }

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return

//     const files = Array.from(e.target.files)
//     if (files.length > 0) {
//       const newImages = files.map((file) => ({
//         id: Math.random().toString(36).substr(2, 9),
//         name: file.name,
//         url: URL.createObjectURL(file),
//         file, // Store the File object for upload
//       }))

//       setCompletionDetails((prev) => ({
//         ...prev,
//         images: [...prev.images, ...newImages],
//       }))
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault()

//     if (!completionDetails.notes) {
//       toast.error("Please provide completion notes")
//       return
//     }

//     if (!userId) {
//       toast.error("User ID not found. Please sign in again.")
//       router.push("/signin")
//       return
//     }

//     setIsSubmitting(true)

//     try {
//       // Submit feedback
//       const formData = new FormData()
//       formData.append("job_ref_id", id)
//       formData.append("bidder_ref_id", userId)
//       formData.append("task_status", completionDetails.status)
//       formData.append("completion_notes", completionDetails.notes)

//       // Append images
//       completionDetails.images.forEach((image) => {
//         formData.append("images", image.file)
//       })

//       const feedbackResponse = await axiosInstance.post(
//         `/job-feedback/`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       )

//       if (feedbackResponse.data.status_code === 200) {
//         toast.success("Feedback submitted successfully!")
//         router.push(`/tasks/${id}`)
//       } else {
//         toast.error(
//           feedbackResponse.data.message || "Failed to submit feedback."
//         )
//       }
//     } catch (error) {
//       console.error("Error submitting feedback:", error)
//       toast.error("An error occurred while submitting feedback.")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   if (loading) {
//     return <div className="flex h-screen items-center justify-center">Loading...</div>
//   }

//   if (!user) {
//     return null // Will redirect in useEffect
//   }

//   return (
//     <div className="flex min-h-screen flex-col">
//       <header className="border-b">
//         <div className="container flex h-16 items-center justify-between px-4 md:px-6">
//           <Link href="/" className="flex items-center gap-2 font-bold text-xl">
//             <span className="text-primary">JobPool</span>
//           </Link>
//           <nav className="hidden md:flex gap-6">
//             <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
//               Dashboard
//             </Link>
//             <Link href="/browse" className="text-sm font-medium hover:underline underline-offset-4">
//               Browse Tasks
//             </Link>
//             <Link href="/post-task" className="text-sm font-medium hover:underline underline-offset-4">
//               Post a Task
//             </Link>
//           </nav>
//         </div>
//       </header>
//       <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
//         <div className="max-w-2xl mx-auto">
//           <div className="mb-6">
//             <Link href={`/tasks/${id}`} className="text-sm text-muted-foreground hover:underline">
//               ← Back to Task
//             </Link>
//           </div>

//           <Card>
//             <CardHeader>
//               <CardTitle>Submit Task Feedback</CardTitle>
//               <CardDescription>Provide details about the task completion</CardDescription>
//             </CardHeader>
//             <form onSubmit={handleSubmit}>
//               <CardContent className="space-y-4">
//                 <div className="space-y-2">
//                   <Label>Task Status</Label>
//                   <RadioGroup
//                     defaultValue="completed"
//                     value={completionDetails.status}
//                     onValueChange={handleRadioChange}
//                     className="flex flex-col space-y-1"
//                   >
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="completed successfully" id="completed" />
//                       <Label htmlFor="completed" className="flex items-center gap-1">
//                         <CheckCircle className="h-4 w-4 text-green-500" />
//                         Completed successfully
//                       </Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="partially completed" id="partial" />
//                       <Label htmlFor="partial" className="flex items-center gap-1">
//                         <AlertCircle className="h-4 w-4 text-yellow-500" />
//                         Partially completed
//                       </Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <RadioGroupItem value="issue" id="issue" />
//                       <Label htmlFor="issue" className="flex items-center gap-1">
//                         <AlertCircle className="h-4 w-4 text-red-500" />
//                         Could not complete (issue)
//                       </Label>
//                     </div>
//                   </RadioGroup>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="notes">Completion Notes</Label>
//                   <Textarea
//                     id="notes"
//                     name="notes"
//                     placeholder="Describe how you completed the task, any challenges faced, etc."
//                     rows={5}
//                     value={completionDetails.notes}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="images">Upload Images (Optional)</Label>
//                   <div className="flex items-center gap-2">
//                     <Input
//                       id="images"
//                       type="file"
//                       accept="image/*"
//                       multiple
//                       onChange={handleImageUpload}
//                       className="hidden"
//                     />
//                     <Label
//                       htmlFor="images"
//                       className="cursor-pointer flex items-center gap-2 border rounded-md px-4 py-2 hover:bg-muted"
//                     >
//                       <Upload className="h-4 w-4" />
//                       Upload Photos
//                     </Label>
//                     <span className="text-sm text-muted-foreground">
//                       {completionDetails.images.length} file(s) selected
//                     </span>
//                   </div>

//                   {completionDetails.images.length > 0 && (
//                     <div className="grid grid-cols-3 gap-2 mt-2">
//                       {completionDetails.images.map((image) => (
//                         <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border">
//                           <img
//                             src={image.url || "/images/placeholder.svg"}
//                             alt={image.name}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//               <CardFooter className="flex justify-between">
//                 <Button variant="outline" type="button" onClick={() => router.back()}>
//                   Cancel
//                 </Button>
//                 <Button type="submit" disabled={isSubmitting}>
//                   {isSubmitting ? "Submitting..." : "Submit Feedback"}
//                 </Button>
//               </CardFooter>
//             </form>
//           </Card>
//         </div>
//       </main>
//     </div>
//   )
// }


"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { CheckCircle, Upload, AlertCircle, Star } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import useStore from "@/lib/Zustand"
import Header from "@/components/Header"

interface UserType {
  id: string
  name: string
  email: string
}

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ImageType {
  id: string
  name: string
  url: string
  file: File
}

interface CompletionDetailsType {
  notes: string
  status: string
  images: ImageType[]
  rating: number
}

export default function CompleteTaskPage({ params }: TaskDetailPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const { userId } = useStore()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [completionDetails, setCompletionDetails] = useState<CompletionDetailsType>({
    notes: "",
    status: "completed",
    images: [],
    rating: 0,
  })

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      // Redirect to sign in if not logged in
      router.push("/signin")
    }
    setLoading(false)
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCompletionDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: string) => {
    setCompletionDetails((prev) => ({ ...prev, status: value }))
  }

  const handleRatingChange = (rating: number) => {
    setCompletionDetails((prev) => ({ ...prev, rating }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const newImages = files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      }))

      setCompletionDetails((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!completionDetails.notes) {
      toast.error("Please provide completion notes")
      return
    }

    if (!userId) {
      toast.error("User ID not found. Please sign in again.")
      router.push("/signin")
      return
    }

    setIsSubmitting(true)

    try {
      // Submit feedback
      const formData = new FormData()
      formData.append("job_ref_id", id)
      formData.append("bidder_ref_id", userId)
      formData.append("task_status", completionDetails.status)
      formData.append("completion_notes", completionDetails.notes)
      formData.append("rating", completionDetails.rating.toString())

      // Append images
      completionDetails.images.forEach((image) => {
        formData.append("images", image.file)
      })

      const feedbackResponse = await axiosInstance.post(
        `/job-feedback/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      )

      if (feedbackResponse.data.status_code === 200) {
        toast.success("Feedback submitted successfully!")
        router.push(`/tasks/${id}`)
      } else {
        toast.error(
          feedbackResponse.data.message || "Failed to submit feedback."
        )
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("An error occurred while submitting feedback.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    localStorage.removeItem("bids")
    router.push("/")
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={{ name: user.name, avatar: "/images/placeholder.svg" }} onSignOut={handleSignOut} />
      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href={`/tasks/${id}`} className="text-sm text-muted-foreground hover:underline">
              ← Back to Task
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submit Task Feedback</CardTitle>
              <CardDescription>Provide details about the task completion</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Status</Label>
                  <RadioGroup
                    defaultValue="completed"
                    value={completionDetails.status}
                    onValueChange={handleRadioChange}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="completed successfully" id="completed" />
                      <Label htmlFor="completed" className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Completed successfully
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partially completed" id="partial" />
                      <Label htmlFor="partial" className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        Partially completed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="issue" id="issue" />
                      <Label htmlFor="issue" className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Could not complete (issue)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Rate the Task (Optional)</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= completionDetails.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {completionDetails.rating > 0 ? `${completionDetails.rating} star${completionDetails.rating !== 1 ? 's' : ''}` : 'No rating'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Completion Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Describe how you completed the task, any challenges faced, etc."
                    rows={5}
                    value={completionDetails.notes}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Upload Images (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="images"
                      className="cursor-pointer flex items-center gap-2 border rounded-md px-4 py-2 hover:bg-muted"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photos
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {completionDetails.images.length} file(s) selected
                    </span>
                  </div>

                  {completionDetails.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {completionDetails.images.map((image) => (
                        <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border">
                          <img
                            src={image.url || "/images/placeholder.svg"}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}