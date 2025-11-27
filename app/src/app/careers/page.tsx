"use client";

import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, Mail } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainHeader />
      <main className="flex-1 container mx-auto max-w-6xl py-8 md:py-12 px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join the JobPool Team</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're building the future of work. Join us in connecting people with opportunities.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Software Engineer
              </CardTitle>
              <CardDescription>Full-time • Remote</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Build scalable features for our platform using modern web technologies.
              </p>
              <Button variant="outline" className="w-full">
                Apply Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Product Designer
              </CardTitle>
              <CardDescription>Full-time • Hybrid</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Design intuitive user experiences that make task management seamless.
              </p>
              <Button variant="outline" className="w-full">
                Apply Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Customer Success
              </CardTitle>
              <CardDescription>Full-time • On-site</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Help our users succeed and build lasting relationships with our community.
              </p>
              <Button variant="outline" className="w-full">
                Apply Now
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Don't see a role that fits?</CardTitle>
            <CardDescription>
              We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full md:w-auto">
              <Mail className="mr-2 h-4 w-4" />
              Send Your Resume
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

