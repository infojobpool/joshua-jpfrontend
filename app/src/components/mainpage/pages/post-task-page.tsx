"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group"
import { Checkbox } from "../../../components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Card, CardContent } from "../../../components/ui/card"
import { Calendar, MapPin, Upload, DollarSign, Info, CheckCircle, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "../../../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"

export function PostTaskPage() {
  const [date, setDate] = useState<Date>()
  const [taskType, setTaskType] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskLocation, setTaskLocation] = useState("")
  const [taskBudget, setTaskBudget] = useState("")
  const [taskDate, setTaskDate] = useState<Date>()
  const [taskTime, setTaskTime] = useState("")
  const [taskDuration, setTaskDuration] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [taskImages, setTaskImages] = useState<string[]>([])
  const [locationType, setLocationType] = useState("in-person")

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1)
    window.scrollTo(0, 0)
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Submit logic would go here
    setCurrentStep(4) // Move to confirmation step
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  }

  return (
    <>
      <section className="bg-slate-50 py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Post a Task</h1>
            <p className="mt-4 text-xl text-gray-500">Tell us what you need done, when, and where</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <div className="flex justify-between items-center">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        step < currentStep
                          ? "bg-green-500 text-white"
                          : step === currentStep
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step < currentStep ? <CheckCircle className="h-5 w-5" /> : step}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {step === 1 && "Details"}
                      {step === 2 && "Location & Date"}
                      {step === 3 && "Budget"}
                      {step === 4 && "Confirmation"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative mt-2">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-full">
                  <div
                    className="h-1 bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit}>
                  {currentStep === 1 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                      <motion.div variants={itemVariants}>
                        <Label htmlFor="task-type" className="text-lg font-medium mb-2 block">
                          What type of task do you need help with?
                        </Label>
                        <Select value={taskType} onValueChange={setTaskType}>
                          <SelectTrigger id="task-type" className="w-full">
                            <SelectValue placeholder="Select task type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="moving">Moving & Delivery</SelectItem>
                            <SelectItem value="cleaning">Home Cleaning</SelectItem>
                            <SelectItem value="handyman">Handyman</SelectItem>
                            <SelectItem value="gardening">Gardening</SelectItem>
                            <SelectItem value="tech">Tech Services</SelectItem>
                            <SelectItem value="business">Business Services</SelectItem>
                            <SelectItem value="pet-care">Pet Care</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <Label htmlFor="task-title" className="text-lg font-medium mb-2 block">
                          Give your task a title
                        </Label>
                        <Input
                          id="task-title"
                          placeholder="e.g. Help moving furniture to new apartment"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-500 mt-1">This helps Taskers understand what you need</p>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <Label htmlFor="task-description" className="text-lg font-medium mb-2 block">
                          Describe your task in detail
                        </Label>
                        <Textarea
                          id="task-description"
                          placeholder="e.g. I need help moving a couch, bed, and dining table from my current apartment to my new place about 2 miles away."
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          className="w-full min-h-[150px]"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Be specific about what you need done, any special requirements, and what materials or
                          equipment might be needed
                        </p>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <Label className="text-lg font-medium mb-2 block">Add photos (optional)</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Drag and drop files here, or click to browse</p>
                          <Input type="file" className="hidden" id="file-upload" multiple accept="image/*" />
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-4"
                            onClick={() => document.getElementById("file-upload")?.click()}
                          >
                            Upload Files
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Photos help Taskers understand your task better (max 5 images)
                        </p>
                      </motion.div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={!taskType || !taskTitle || !taskDescription}
                        >
                          Next: Location & Date
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                      <motion.div variants={itemVariants}>
                        <Label className="text-lg font-medium mb-2 block">Is this an in-person or remote task?</Label>
                        <RadioGroup
                          value={locationType}
                          onValueChange={setLocationType}
                          className="flex flex-col space-y-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="in-person" id="in-person" />
                            <Label htmlFor="in-person">In-person task</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="remote" id="remote" />
                            <Label htmlFor="remote">Remote task</Label>
                          </div>
                        </RadioGroup>
                      </motion.div>

                      {locationType === "in-person" && (
                        <motion.div variants={itemVariants}>
                          <Label htmlFor="task-location" className="text-lg font-medium mb-2 block">
                            Where will this task take place?
                          </Label>
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                            <Input
                              id="task-location"
                              placeholder="Enter address or location"
                              value={taskLocation}
                              onChange={(e) => setTaskLocation(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">This helps match you with nearby Taskers</p>
                        </motion.div>
                      )}

                      <motion.div variants={itemVariants}>
                        <Label className="text-lg font-medium mb-2 block">When do you need this done?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="task-date" className="text-sm font-medium mb-1 block">
                              Date
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label htmlFor="task-time" className="text-sm font-medium mb-1 block">
                              Time
                            </Label>
                            <Select value={taskTime} onValueChange={setTaskTime}>
                              <SelectTrigger id="task-time" className="w-full">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                                <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                                <SelectItem value="evening">Evening (5pm - 9pm)</SelectItem>
                                <SelectItem value="specific">Specific time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <Label htmlFor="task-duration" className="text-lg font-medium mb-2 block">
                          How long do you think this will take?
                        </Label>
                        <Select value={taskDuration} onValueChange={setTaskDuration}>
                          <SelectTrigger id="task-duration" className="w-full">
                            <SelectValue placeholder="Select estimated duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small - less than 1 hour</SelectItem>
                            <SelectItem value="medium">Medium - 1-3 hours</SelectItem>
                            <SelectItem value="large">Large - 3-6 hours</SelectItem>
                            <SelectItem value="extra-large">Extra large - 6+ hours</SelectItem>
                            <SelectItem value="multi-day">Multi-day task</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">This helps Taskers provide accurate quotes</p>
                      </motion.div>

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={handlePrevStep}>
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={
                            (locationType === "in-person" && !taskLocation) || !date || !taskTime || !taskDuration
                          }
                        >
                          Next: Budget
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                      <motion.div variants={itemVariants}>
                        <Label htmlFor="task-budget" className="text-lg font-medium mb-2 block">
                          What's your budget for this task?
                        </Label>
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                          <Input
                            id="task-budget"
                            type="number"
                            placeholder="Enter amount"
                            value={taskBudget}
                            onChange={(e) => setTaskBudget(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Set a realistic budget to attract qualified Taskers
                        </p>
                      </motion.div>

                      <motion.div variants={itemVariants} className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                          <div>
                            <h3 className="font-medium">How pricing works</h3>
                            <p className="text-sm text-gray-600">
                              Taskers will make offers based on your task details and budget. You can review offers and
                              choose the best Tasker for your needs.
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="terms" />
                          <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            I agree to the{" "}
                            <Link href="/terms" className="text-blue-600 hover:underline">
                              terms of service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-blue-600 hover:underline">
                              privacy policy
                            </Link>
                          </label>
                        </div>
                      </motion.div>

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={handlePrevStep}>
                          Back
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={!taskBudget}>
                          Post Task
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-6 text-center"
                    >
                      <motion.div variants={itemVariants} className="py-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Your task has been posted!</h2>
                        <p className="text-gray-500 mb-6">
                          Taskers will start making offers soon. We'll notify you when they do.
                        </p>

                        <div className="bg-slate-50 p-6 rounded-lg mb-6 text-left">
                          <h3 className="font-bold mb-4">Task Summary</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Title:</span>
                              <span className="font-medium">{taskTitle}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Category:</span>
                              <span className="font-medium">{taskType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Location:</span>
                              <span className="font-medium">{locationType === "remote" ? "Remote" : taskLocation}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Date:</span>
                              <span className="font-medium">{date ? format(date, "PPP") : ""}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Budget:</span>
                              <span className="font-medium">${taskBudget}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Link href="/dashboard">
                            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">Go to Dashboard</Button>
                          </Link>
                          <Link href="/">
                            <Button variant="outline" className="w-full sm:w-auto">
                              Back to Home
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </form>
              </CardContent>
            </Card>

            {currentStep < 4 && (
              <div className="mt-8 bg-slate-50 p-6 rounded-lg">
                <h3 className="font-bold mb-4">Tips for getting great offers</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Be specific about what you need done</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Include clear photos if relevant</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Set a realistic budget based on the task complexity</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>Be responsive to questions from potential Taskers</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
