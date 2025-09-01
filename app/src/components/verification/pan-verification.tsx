// pan verification
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle } from "lucide-react"
import axiosInstance from "../../lib/axiosInstance"
import useStore from "../../lib/Zustand";

interface PanVerificationProps {
  onComplete: () => void
}

export default function PanVerification({ onComplete }: PanVerificationProps) {
  const [panNumber, setPanNumber] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [panName, setPanName] = useState("")
  const [error, setError] = useState("")

  const { userId } = useStore();

  const handleVerify = async () => {
    // Reset states
    setError("")
    setIsVerifying(true)

    if (!userId) {
      setIsVerifying(false)
      setError("User ID not found. Please log in and try again.")
      return
    }

    try {
      const response = await axiosInstance.post(`/verify-pan/?user_id=${userId}&pan=${panNumber}`);

      const data = response.data

      setIsVerifying(false)

      if (data.status_code === 200 && data.data.valid) {
        setIsVerified(true)
        setPanName(data.data.registered_name || "Name not provided") 

        localStorage.setItem("registered_name", data.data.registered_name || "Name not provided")
      } else {
        setError(data.message || "Unable to verify PAN. Please check the number and try again.")
      }
    } catch (err: any) {
      setIsVerifying(false)
      setError(
        err.response?.data?.message || "Failed to connect to the server. Please try again later."
      )
    }
  }


  const handleContinue = () => {
    onComplete()
  }

  const isPanNumberValid = (pan: string) => {
    // Basic PAN validation - 10 characters, alphanumeric
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(pan)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="flex w-full items-center justify-center md:w-1/3">
          <div className="rounded-lg bg-primary/10 p-4">
            <img
              src="/images/placeholder.svg?height=120&width=120"
              alt="PAN Card Verification"
              className="h-24 w-24 object-contain"
            />
          </div>
        </div>
        <div className="w-full md:w-2/3">
          <h3 className="text-lg font-medium">PAN Card Verification</h3>
          <p className="text-sm text-gray-500">Enter your PAN (Permanent Account Number) to verify your identity.</p>
        </div>
      </div>

      <div className="space-y-4">
        {!isVerified ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="pan-number">PAN Number</Label>
              <Input
                id="pan-number"
                placeholder="ABCDE1234F"
                value={panNumber}
                onChange={(e) => {
                  setPanNumber(e.target.value.toUpperCase())
                  setError("")
                }}
                maxLength={10}
              />
              {panNumber && !isPanNumberValid(panNumber) && (
                <p className="text-xs text-red-500">Please enter a valid PAN number (e.g., ABCDE1234F)</p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={!panNumber || !isPanNumberValid(panNumber) || isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify PAN"}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">PAN Verified Successfully</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your PAN has been verified. Details retrieved from database:</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">PAN Number</p>
                  <p className="font-medium">{panNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Name as per PAN</p>
                  <p className="font-medium">{panName}</p>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleContinue}>
              Continue to Next Step
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
