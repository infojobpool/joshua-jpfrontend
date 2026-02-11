"use client"
import { SupportForm } from "../../components/support/support-form"
import { FAQSection } from "../../components/support/faq-section"
import { ContactInfo } from "../../components/support/contact-info"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { HeadphonesIcon, MessageSquare, HelpCircle } from "lucide-react"

interface SupportFormData {
  name: string
  email: string
  phone: string
  category: string
  priority: string
  subject: string
  description: string
  attachments: File[]
  agreeToTerms: boolean
}

export default function SupportPage() {
  const handleSupportSubmit = async (data: SupportFormData) => {
    // Convert files to base64 for sending
    const attachmentPromises = (data.attachments || []).map(async (file) => {
      return new Promise<{ name: string; content: string; type: string }>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1] // Remove data:image/png;base64, prefix
          resolve({
            name: file.name,
            content: base64String,
            type: file.type,
          })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    })

    const attachments = await Promise.all(attachmentPromises)

    const response = await fetch("/api/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        category: data.category,
        priority: data.priority,
        subject: data.subject,
        description: data.description,
        attachments,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to submit support request")
    }

    const result = await response.json()
    return result.ticketId
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Support Center</h1>
          <p className="text-muted-foreground">
            We're here to help! Get in touch with our support team or find answers to common questions.
          </p>
        </div>

        <Tabs defaultValue="contact" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Contact Us</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span>FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center space-x-2">
              <HeadphonesIcon className="h-4 w-4" />
              <span>Contact Info</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SupportForm onSubmit={handleSupportSubmit} />
              </div>
              <div className="lg:col-span-1">
                <ContactInfo />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <div className="max-w-4xl mx-auto">
              <FAQSection />
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="max-w-2xl mx-auto">
              <ContactInfo />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
