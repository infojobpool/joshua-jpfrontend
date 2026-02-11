import { NextResponse } from "next/server"
import { updateTicketStatus, getTicketById } from "@/lib/tickets-store"

export async function PATCH(
  request: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!["open", "working", "resolved", "closed"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 },
      )
    }

    const updatedTicket = updateTicketStatus(params.ticketId, status)

    if (!updatedTicket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Ticket status updated",
      ticket: updatedTicket,
    })
  } catch (error) {
    console.error("Error updating ticket status", error)
    return NextResponse.json(
      { success: false, message: "Failed to update ticket status" },
      { status: 500 },
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
    const ticket = getTicketById(params.ticketId)

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error("Error fetching ticket", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch ticket" },
      { status: 500 },
    )
  }
}
