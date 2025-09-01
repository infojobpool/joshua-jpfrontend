"use client"

import { Shield, Lock, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VerificationIntroProps {
  onStart: () => void
}

export default function VerificationIntro({ onStart }: VerificationIntroProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-medium">Why We Need Verification</h3>
        <p className="mt-2 text-gray-600">
          Completing the verification process helps us ensure security and comply with regulations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <div className="rounded-full bg-primary/10 p-2">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">Enhanced Security</h4>
            <p className="text-sm text-gray-600">
              Verification helps protect your account and financial transactions from fraud.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <div className="rounded-full bg-primary/10 p-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">Regulatory Compliance</h4>
            <p className="text-sm text-gray-600">
              We're required to verify your identity to comply with KYC and AML regulations.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <div className="rounded-full bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">Quick Process</h4>
            <p className="text-sm text-gray-600">
              The verification process takes just a few minutes and can be completed in steps.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <div className="rounded-full bg-primary/10 p-2">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">Skip Anytime</h4>
            <p className="text-sm text-gray-600">
              You can skip any step and complete it later, though some features may be limited.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="font-medium">What You'll Need:</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>PAN Card</li>
          <li>Aadhar Card or access to your registered mobile for OTP</li>
          <li>Bank account details</li>
          <li>Optional: Cancelled cheque for bank verification</li>
        </ul>
      </div>

      <div className="flex justify-center">
        {/* <Button onClick={onStart} className="px-8">
          Begin Verification
        </Button> */}
      </div>
    </div>
  )
}
