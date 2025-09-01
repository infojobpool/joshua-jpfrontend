"use client"

import { CheckCircle, Download, Home } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"

interface PaymentSuccessProps {
  show: boolean
  transactionId: string
  amount: number
  onClose: () => void
  onDownloadReceipt?: () => void
  onGoHome?: () => void
}

export function PaymentSuccess({
  show,
  transactionId,
  amount,
  onClose,
  onDownloadReceipt,
  onGoHome,
}: PaymentSuccessProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
          <CardDescription>Your payment has been processed successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-2 bg-green-50">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-sm">{transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold text-green-600">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time</span>
              <span className="text-sm">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            A confirmation email has been sent to your registered email address.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex w-full space-x-2">
            {onDownloadReceipt && (
              <Button variant="outline" onClick={onDownloadReceipt} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            )}
            {onGoHome && (
              <Button variant="outline" onClick={onGoHome} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
          <Button onClick={onClose} className="w-full">
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
