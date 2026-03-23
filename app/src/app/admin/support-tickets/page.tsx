"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, Phone, Calendar, FileText, AlertCircle, Wallet } from "lucide-react"
import { toast } from "sonner"

interface SupportTicket {
  ticketId: string
  name: string
  email: string
  phone?: string
  category?: string
  priority?: string
  subject: string
  description: string
  attachments?: { name: string; content: string; type: string }[]
  status: "open" | "working" | "resolved" | "closed"
  createdAt: string
  updatedAt: string
}

export default function SupportTicketsAdminPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/support")
      if (!response.ok) throw new Error("Failed to fetch tickets")

      const data = await response.json()
      if (data.success) {
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast.error("Failed to load support tickets")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const updateTicketStatus = async (ticketId: string, newStatus: SupportTicket["status"]) => {
    try {
      const response = await fetch(`/api/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      const data = await response.json()
      if (data.success) {
        toast.success("Ticket status updated")
        fetchTickets() // Refresh the list
      }
    } catch (error) {
      console.error("Error updating ticket status:", error)
      toast.error("Failed to update ticket status")
    }
  }

  const filteredTickets =
    statusFilter === "all"
      ? tickets
      : tickets.filter((ticket) => ticket.status === statusFilter)

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    working: tickets.filter((t) => t.status === "working").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  }

  const getStatusBadgeColor = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "working":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link
            href="/admin/withdrawals"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors font-medium"
          >
            <Wallet className="h-4 w-4" />
            Wallet Withdrawals
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-500">Support Tickets</span>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
          <p className="text-gray-600">Manage and track all support requests</p>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{statusCounts.all}</div>
                <div className="text-sm text-gray-500">Total Tickets</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statusCounts.open}</div>
                <div className="text-sm text-gray-500">Open</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.working}</div>
                <div className="text-sm text-gray-500">Working</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statusCounts.resolved}</div>
                <div className="text-sm text-gray-500">Resolved</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{statusCounts.closed}</div>
                <div className="text-sm text-gray-500">Closed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets ({statusCounts.all})</SelectItem>
              <SelectItem value="open">Open ({statusCounts.open})</SelectItem>
              <SelectItem value="working">Working ({statusCounts.working})</SelectItem>
              <SelectItem value="resolved">Resolved ({statusCounts.resolved})</SelectItem>
              <SelectItem value="closed">Closed ({statusCounts.closed})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading tickets...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-gray-500">
                  {statusFilter === "all"
                    ? "No support tickets have been submitted yet."
                    : `No tickets with status "${statusFilter}".`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.ticketId}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">#{ticket.ticketId}</CardTitle>
                        <Badge className={getStatusBadgeColor(ticket.status)}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </Badge>
                        {ticket.priority && (
                          <Badge className={getPriorityBadgeColor(ticket.priority)}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">{ticket.subject}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {ticket.email}
                        </span>
                        {ticket.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {ticket.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(ticket.createdAt)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={ticket.status}
                        onValueChange={(value) =>
                          updateTicketStatus(ticket.ticketId, value as SupportTicket["status"])
                        }
                      >
                        <SelectTrigger className="w-full md:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="working">Working</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Description</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {ticket.category && (
                      <div>
                        <span className="font-medium">Category: </span>
                        <span className="text-gray-600">{ticket.category}</span>
                      </div>
                    )}

                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div>
                        <span className="font-medium">Attachments: </span>
                        <span className="text-gray-600">
                          {ticket.attachments.map((att) => att.name).join(", ")}
                        </span>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Updated: {formatDate(ticket.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
