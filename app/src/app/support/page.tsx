"use client"

import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { HeadphonesIcon, MessageSquare, HelpCircle, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
       
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Our Platform</h1>
          <p className="text-xl text-muted-foreground mb-8">Your one-stop solution for all your service needs</p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link href="/supportpagepage">Get Support</Link>
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Submit a support ticket and get help from our team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/supportpage">
                  Contact Us <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <HelpCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>FAQ</CardTitle>
              <CardDescription>Find quick answers to frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/supportpage?tab=faq">
                  View FAQ <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <HeadphonesIcon className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Live Support</CardTitle>
              <CardDescription>Get immediate help through phone or live chat</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/supportpage?tab=info">
                  Contact Info <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is available 24/7 to assist you with any questions or issues.
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" asChild>
              <a href="mailto:support@example.com">Email Us</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="tel:+911234567890">Call Us</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
