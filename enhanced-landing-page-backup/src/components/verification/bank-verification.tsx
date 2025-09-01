// "use client"

// import type React from "react"
// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { CheckCircle } from "lucide-react"
// import axiosInstance from "../../lib/axiosInstance"
// import useStore from "../../lib/Zustand"

// interface BankVerificationProps {
//   onComplete: () => void
// }

// interface BankDetails {
//   accountHolderName: string
//   bankName: string
//   branchName: string
// }

// export default function BankVerification({ onComplete }: BankVerificationProps) {
//   const [accountNumber, setAccountNumber] = useState("")
//   const [ifscCode, setIfscCode] = useState("")
//   const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
//   const [isVerifying, setIsVerifying] = useState(false)
//   const [isVerified, setIsVerified] = useState(false)
//   const [error, setError] = useState("")
//   const { userId } = useStore()

//   const handleVerify = async () => {
//     setError("")
//     setIsVerifying(true)

//     if (!userId) {
//       setIsVerifying(false)
//       setError("User ID not found. Please log in and try again.")
//       return
//     }

//     const registeredName = localStorage.getItem("registered_name");

//     if (!registeredName) {

//       setIsVerifying(false)

//       setError("PAN verification data not found. Please complete PAN verification first.")

//       return

//     }

//     try {
//       const response = await axiosInstance.post(`/verify-bank/?pan_name=${registeredName}&&bank_account_number=${accountNumber}&ifsc_code=${ifscCode}&user_id=${userId}`)
//       const data = response.data

//       console.log("Bank verification response:", data) // Debug log

//       setIsVerifying(false)

//       // Handle both string and number status codes
//       if (data.status_code == 200) { // Using == to handle both "200" and 200
//         setBankDetails({
//           accountHolderName: data.data.name_at_bank,
//           bankName: data.data.bank_name,
//           branchName: data.data.ifsc_details?.branch || "N/A",
//         })
//         setIsVerified(true)
//       } else {
//         setError(data.message || "Unable to verify bank details. Please check the account number and IFSC code.")
//       }
//     } catch (err: any) {
//       console.error("Bank verification error:", err) // Debug log
//       setIsVerifying(false)
//       setError(err.response?.data?.message || "Failed to connect to the server. Please try again later.")
//     }
//   }

//   const handleNext = () => {
//     onComplete()
//   }

//   const isAccountNumberValid = (account: string) => {
//     // Basic account number validation (8-16 digits)
//     const accountRegex = /^\d{8,16}$/
//     return accountRegex.test(account)
//   }

//   const isIfscCodeValid = (ifsc: string) => {
//     // IFSC code validation (4 letters + 0 + 6 alphanumeric)
//     const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
//     return ifscRegex.test(ifsc)
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col items-center gap-4 md:flex-row">
//         <div className="flex w-full items-center justify-center md:w-1/3">
//           <div className="rounded-lg bg-primary/10 p-4">
//             <img
//               src="/images/placeholder.svg?height=120&width=120"
//               alt="Bank Verification"
//               className="h-24 w-24 object-contain"
//             />
//           </div>
//         </div>
//         <div className="w-full md:w-2/3">
//           <h3 className="text-lg font-medium">Bank Account Verification</h3>
//           <p className="text-sm text-gray-500">
//             Verify your bank account details to proceed.
//           </p>
//         </div>
//       </div>

//       <div className="space-y-4">
//         {!isVerified ? (
//           <>
//             <div className="space-y-2">
//               <Label htmlFor="account-number">Account Number</Label>
//               <Input
//                 id="account-number"
//                 placeholder="Enter bank account number"
//                 value={accountNumber}
//                 onChange={(e) => {
//                   setAccountNumber(e.target.value.replace(/\D/g, ""))
//                   setError("")
//                 }}
//                 maxLength={16}
//               />
//               {accountNumber && !isAccountNumberValid(accountNumber) && (
//                 <p className="text-xs text-red-500">Please enter a valid account number (8-16 digits)</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="ifsc-code">IFSC Code</Label>
//               <Input
//                 id="ifsc-code"
//                 placeholder="Enter IFSC code"
//                 value={ifscCode}
//                 onChange={(e) => {
//                   setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
//                   setError("")
//                 }}
//                 maxLength={11}
//               />
//               {ifscCode && !isIfscCodeValid(ifscCode) && (
//                 <p className="text-xs text-red-500">Please enter a valid IFSC code (e.g., SBIN0001234)</p>
//               )}
//             </div>

//             <Button
//               className="w-full"
//               onClick={handleVerify}
//               disabled={
//                 !accountNumber ||
//                 !ifscCode ||
//                 !isAccountNumberValid(accountNumber) ||
//                 !isIfscCodeValid(ifscCode) ||
//                 isVerifying
//               }
//             >
//               {isVerifying ? "Verifying..." : "Verify Bank Details"}
//             </Button>
//             {error && <p className="text-xs text-red-500">{error}</p>}
//           </>
//         ) : (
//           <>
//             <div className="rounded-md bg-green-50 p-4">
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   <CheckCircle className="h-5 w-5 text-green-500" />
//                 </div>
//                 <div className="ml-3">
//                   <h3 className="text-sm font-medium text-green-800">Bank Verified Successfully</h3>
//                   <div className="mt-2 text-sm text-green-700">
//                     <p>Your bank account has been verified successfully.</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-md border p-4 space-y-2">
//               <div>
//                 <p className="text-sm font-medium text-gray-500">Account Holder Name</p>
//                 <p className="font-medium">{bankDetails?.accountHolderName}</p>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-500">Bank Name</p>
//                 <p className="font-medium">{bankDetails?.bankName}</p>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-500">Branch Name</p>
//                 <p className="font-medium">{bankDetails?.branchName}</p>
//               </div>
//             </div>

//             <Button className="w-full" onClick={handleNext}>
//               Completed Go to Next Step
//             </Button>
//           </>
//         )}
//       </div>
//     </div>
//   )
// }



"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";
import useStore from "../../lib/Zustand";

interface BankVerificationProps {
  onComplete: () => void;
}

interface BankDetails {
  bankAccountNumber: string;
  ifscCode: string;
}

export default function BankVerification({ onComplete }: BankVerificationProps) {
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const { userId } = useStore();

  const handleVerify = async () => {
    setError("");
    setIsVerifying(true);

    if (!userId) {
      setIsVerifying(false);
      setError("User ID not found. Please log in and try again.");
      return;
    }

    try {
      const response = await axiosInstance.post("/verify-bank/", {
        bank_account_number: accountNumber,
        ifsc_code: ifscCode,
        user_id: userId,
      });
      const data = response.data;

      console.log("Bank verification response:", data);

      setIsVerifying(false);

      if (data.status_code === 200) {
        setBankDetails({
          bankAccountNumber: data.data.bank_account_number,
          ifscCode: data.data.ifsc_code,
        });
        setIsVerified(true);

        // Update user in localStorage with new verification_status
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            parsedUser.verification_status = 3;
            localStorage.setItem("user", JSON.stringify(parsedUser));
          } catch (error) {
            console.error("Failed to update user in localStorage:", error);
          }
        }
      } else {
        setError(data.message || "Unable to verify bank details. Please check the account number and IFSC code.");
      }
    } catch (err: any) {
      console.error("Bank verification error:", err);
      setIsVerifying(false);
      setError(err.response?.data?.message || "Failed to connect to the server. Please try again later.");
    }
  };

  const handleNext = () => {
    onComplete();
  };

  const isAccountNumberValid = (account: string) => {
    const accountRegex = /^\d{8,16}$/;
    return accountRegex.test(account);
  };

  const isIfscCodeValid = (ifsc: string) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="flex w-full items-center justify-center md:w-1/3">
          <div className="rounded-lg bg-primary/10 p-4">
            <img
              src="/images/placeholder.svg?height=120&width=120"
              alt="Bank Verification"
              className="h-24 w-24 object-contain"
            />
          </div>
        </div>
        <div className="w-full md:w-2/3">
          <h3 className="text-lg font-medium">Bank Account Verification</h3>
          <p className="text-sm text-gray-500">
            Verify your bank account details to proceed.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {!isVerified ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Enter bank account number"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                maxLength={16}
              />
              {accountNumber && !isAccountNumberValid(accountNumber) && (
                <p className="text-xs text-red-500">Please enter a valid account number (8-16 digits)</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ifsc-code">IFSC Code</Label>
              <Input
                id="ifsc-code"
                placeholder="Enter IFSC code"
                value={ifscCode}
                onChange={(e) => {
                  setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                  setError("");
                }}
                maxLength={11}
              />
              {ifscCode && !isIfscCodeValid(ifscCode) && (
                <p className="text-xs text-red-500">Please enter a valid IFSC code (e.g., SBIN0001234)</p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={
                !accountNumber ||
                !ifscCode ||
                !isAccountNumberValid(accountNumber) ||
                !isIfscCodeValid(ifscCode) ||
                isVerifying
              }
            >
              {isVerifying ? "Verifying..." : "Submit Details"}
            </Button>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </>
        ) : (
          <>
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Bank Verified Successfully</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your bank account has been verified successfully.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Account Number</p>
                <p className="font-medium">{bankDetails?.bankAccountNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">IFSC Code</p>
                <p className="font-medium">{bankDetails?.ifscCode}</p>
              </div>
            </div>

            <Button className="w-full" onClick={handleNext}>
              Go to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}