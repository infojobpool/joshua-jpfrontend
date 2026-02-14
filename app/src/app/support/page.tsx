"use client"

import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { HelpCircle, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
       
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Our Platform</h1>
          <p className="text-xl text-muted-foreground">Your one-stop solution for all your service needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 max-w-md mx-auto gap-6 mb-12">
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
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is available 24/7 to assist you with any questions or issues.
          </p>
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <a href="mailto:info@jobpool.in">Email Us</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
