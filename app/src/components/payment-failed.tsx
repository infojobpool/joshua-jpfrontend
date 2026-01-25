"use client"

import { XCircle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface PaymentFailedProps {
  show: boolean
  errorMessage?: string
  onClose: () => void
  onRetry?: () => void
  onGoHome?: () => void
}

export function PaymentFailed({
  show,
  errorMessage = "Payment could not be processed. Please try again.",
  onClose,
  onRetry,
  onGoHome,
}: PaymentFailedProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Payment Failed</CardTitle>
          <CardDescription>We couldn't process your payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`border rounded-lg p-4 ${errorMessage?.includes("Payment was successful") || errorMessage?.includes("couldn't verify") ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
            <div className={`text-sm ${errorMessage?.includes("Payment was successful") || errorMessage?.includes("couldn't verify") ? "text-yellow-800" : "text-red-700"}`}>
              <strong>{errorMessage?.includes("Payment was successful") || errorMessage?.includes("couldn't verify") ? "Notice:" : "Error:"}</strong> {errorMessage}
            </div>
          </div>

          {!(errorMessage?.includes("Payment was successful") || errorMessage?.includes("couldn't verify")) && (
            <>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Common reasons for payment failure:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Insufficient funds in your account</li>
              <li>Incorrect card details</li>
              <li>Card expired or blocked</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Please check your payment details and try again, or contact support if the issue persists.
          </div>
            </>
          )}

          {(errorMessage?.includes("Payment was successful") || errorMessage?.includes("couldn't verify")) && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-yellow-800">
                <strong>What to do:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-yellow-700">
                <li>Check your payment status in your dashboard</li>
                <li>Wait a few minutes and refresh the page</li>
                <li>Contact support with your Payment ID if the issue persists</li>
                <li>Your payment may have been processed successfully</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex w-full space-x-2">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {onGoHome && (
              <Button variant="outline" onClick={onGoHome} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
