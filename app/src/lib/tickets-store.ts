// Shared tickets store (in-memory for MVP)
// In production, replace this with database calls

export interface SupportTicket {
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

let ticketsStore: SupportTicket[] = []

export function addTicket(ticket: SupportTicket) {
  ticketsStore.push(ticket)
  return ticket
}

export function getTickets(): SupportTicket[] {
  return [...ticketsStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getTicketById(ticketId: string): SupportTicket | undefined {
  return ticketsStore.find((t) => t.ticketId === ticketId)
}

export function updateTicketStatus(
  ticketId: string,
  status: "open" | "working" | "resolved" | "closed"
): SupportTicket | null {
  const ticket = ticketsStore.find((t) => t.ticketId === ticketId)
  if (!ticket) return null

  ticket.status = status
  ticket.updatedAt = new Date().toISOString()
  return ticket
}

export function getTicketsByStatus(status: SupportTicket["status"]): SupportTicket[] {
  return ticketsStore.filter((t) => t.status === status)
}
