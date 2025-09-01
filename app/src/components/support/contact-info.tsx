"use client"

import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ContactInfo() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      contact: "info@jobpool.in",
      action: "Send Email",
      href: "mailto:info@jobpool.in",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our team",
      contact: "+91-7799789200",
      action: "Call Now",
      href: "tel:+917799789200",
    },
    // {
    //   icon: MessageCircle,
    //   title: "Live Chat",
    //   description: "Chat with us in real-time",
    //   contact: "Available 24/7",
    //   action: "Start Chat",
    //   href: "#",
    // },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Multiple ways to reach our support team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactMethods.map((method, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                <method.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{method.title}</h3>
                <p className="text-sm text-muted-foreground">{method.description}</p>
                <p className="text-sm font-medium">{method.contact}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={method.href}>{method.action}</a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Office Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium">Address</h3>
              <p className="text-sm text-muted-foreground">
                Sri Sai Complex, 2nd Floor,<br />
Sushma Sai Nagar Colony,<br />
Vanasthalipuram, Hyd - 70

               
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium">Business Hours</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Monday to Sunday – 24 Hours Live</p>
                
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Email Support</span>
              <span className="text-sm font-medium">Within 24 hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Phone Support</span>
              <span className="text-sm font-medium">Immediate</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Live Chat</span>
              <span className="text-sm font-medium">Within 5 minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Urgent Issues</span>
              <span className="text-sm font-medium">Within 2 hours</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
