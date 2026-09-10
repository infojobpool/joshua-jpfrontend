"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Save, Mail, Phone, MapPin, Building, Calendar } from "lucide-react"
import useStore from "@/lib/Zustand"
import { useCanAdminWrite } from "@/lib/adminAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { AdminTwoFactorSettings } from "@/components/admin/AdminTwoFactorSettings"

// Define the Admin type for TypeScript
interface Admin {
  id: number
  name: string
  email: string
  phone: string
  role: string
  avatar: string
  joinDate: string
  address: string
  company: string
  bio: string
}

// Define the Notifications type for TypeScript
interface Notifications {
  email: boolean
  push: boolean
  taskUpdates: boolean
  newUsers: boolean
  systemAlerts: boolean
  marketingEmails: boolean
}

export default function AdminProfilePage() {
  const checkAuth = useStore((s) => s.checkAuth)
  const storeUser = useStore((s) => s.user)
  const role = useStore((s) => s.role)
  const canWrite = useCanAdminWrite()

  const [admin, setAdmin] = useState<Admin | null>(null)
  const [profileReady, setProfileReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [notifications, setNotifications] = useState<Notifications>({
    email: true,
    push: false,
    taskUpdates: true,
    newUsers: true,
    systemAlerts: true,
    marketingEmails: false,
  })

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const name = storeUser?.name?.trim()
    const email = storeUser?.email?.trim()
    if (name || email) {
      setAdmin({
        id: 0,
        name: name || "Admin",
        email: email || "",
        phone: "",
        role: role?.trim() || "Admin",
        avatar: "/images/placeholder.svg",
        joinDate: new Date().toISOString().slice(0, 10),
        address: "",
        company: "",
        bio: "",
      })
      setProfileReady(true)
      return
    }
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const u = JSON.parse(raw) as {
          user_fullname?: string
          user_email?: string
        }
        const n = u.user_fullname?.trim()
        const em = u.user_email?.trim()
        if (n || em) {
          setAdmin({
            id: 0,
            name: n || "Admin",
            email: em || "",
            phone: "",
            role: role?.trim() || "Admin",
            avatar: "/images/placeholder.svg",
            joinDate: new Date().toISOString().slice(0, 10),
            address: "",
            company: "",
            bio: "",
          })
        }
      }
    } catch {
      /* ignore */
    }
    setProfileReady(true)
  }, [storeUser, role])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canWrite) {
      setError("Read-only access.")
      return
    }
    setError("")
    setIsLoading(true)

    try {
      // Simulate API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 1500))
      // In a real application, you would send updated admin data to your backend
      // Example:
      // const response = await fetch("/api/admin/profile", {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(admin),
      // })
      // if (!response.ok) throw new Error("Failed to update profile")
      // toast({
      //   title: "Profile updated",
      //   description: "Your profile information has been updated successfully.",
      // })
    } catch {
      setError("Failed to update profile. Please try again.")
      // toast({
      //   title: "Update failed",
      //   description: "There was a problem updating your profile. Please try again.",
      //   variant: "destructive",
      // })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    if (!canWrite) {
      setError("Read-only access.")
      return
    }
    setError("")
    setIsLoading(true)

    try {
      // Simulate API call to update notification settings
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // In a real application, you would send updated notifications to your backend
      // Example:
      // const response = await fetch("/api/admin/notifications", {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(notifications),
      // })
      // if (!response.ok) throw new Error("Failed to update notifications")
      // toast({
      //   title: "Notification settings updated",
      //   description: "Your notification preferences have been saved.",
      // })
    } catch {
      setError("Failed to update notification settings. Please try again.")
      // toast({
      //   title: "Update failed",
      //   description: "There was a problem updating your notification settings. Please try again.",
      //   variant: "destructive",
      // })
    } finally {
      setIsLoading(false)
    }
  }

  if (!profileReady) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <p className="text-muted-foreground">Loading profile…</p>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full min-h-[200px] text-center px-4">
        <p className="text-muted-foreground">Could not load your profile. Try signing in again.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Profile</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-1/3">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal and contact information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={admin.avatar || "/images/placeholder.svg"} alt={admin.name} />
              <AvatarFallback>
                {admin.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-medium">{admin.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{admin.role}</p>

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{admin.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{admin.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{admin.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{admin.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Joined {new Date(admin.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex-1">
          <Tabs defaultValue="account">
            <TabsList className="mb-4">
              <TabsTrigger value="account">Account Settings</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Update your account details and profile information</CardDescription>
                </CardHeader>
                <form onSubmit={handleProfileUpdate}>
                  <CardContent className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm bg-red-50 text-red-500 rounded-md">{error}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={admin.name}
                          readOnly={!canWrite}
                          onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={admin.email}
                          readOnly={!canWrite}
                          onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={admin.phone}
                          readOnly={!canWrite}
                          onChange={(e) => setAdmin({ ...admin, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={admin.company}
                          readOnly={!canWrite}
                          onChange={(e) => setAdmin({ ...admin, company: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={admin.address}
                        readOnly={!canWrite}
                        onChange={(e) => setAdmin({ ...admin, address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        value={admin.bio}
                        readOnly={!canWrite}
                        onChange={(e) => setAdmin({ ...admin, bio: e.target.value })}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoading || !canWrite} title={!canWrite ? "Read-only role" : undefined}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="p-3 text-sm bg-red-50 text-red-500 rounded-md">{error}</div>
                  )}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Notification Channels</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        disabled={!canWrite}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notifications.push}
                        disabled={!canWrite}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Notification Types</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="task-updates">Task Updates</Label>
                        <p className="text-sm text-muted-foreground">Notifications about task status changes</p>
                      </div>
                      <Switch
                        id="task-updates"
                        checked={notifications.taskUpdates}
                        disabled={!canWrite}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, taskUpdates: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="new-users">New Users</Label>
                        <p className="text-sm text-muted-foreground">Notifications when new users register</p>
                      </div>
                      <Switch
                        id="new-users"
                        checked={notifications.newUsers}
                        disabled={!canWrite}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, newUsers: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="system-alerts">System Alerts</Label>
                        <p className="text-sm text-muted-foreground">Important system notifications and alerts</p>
                      </div>
                      <Switch
                        id="system-alerts"
                        checked={notifications.systemAlerts}
                        disabled={!canWrite}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, systemAlerts: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing-emails">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Receive marketing and promotional emails</p>
                      </div>
                      <Switch
                        id="marketing-emails"
                        checked={notifications.marketingEmails}
                        disabled={!canWrite}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleNotificationUpdate} disabled={isLoading || !canWrite} title={!canWrite ? "Read-only role" : undefined}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Two-factor authentication for admin login. Profile → Security uses{" "}
                    <code className="text-xs bg-muted px-1 rounded">/admin/2fa/*</code> APIs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminTwoFactorSettings canWrite={canWrite} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}