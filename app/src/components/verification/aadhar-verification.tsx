// "use client"

// import type React from "react"
// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { CheckCircle } from "lucide-react"
// import axiosInstance from "../../lib/axiosInstance"
// import useStore from "../../lib/Zustand";

// interface AadharVerificationProps {
//   onComplete: () => void
// }

// export default function AadharVerification({ onComplete }: AadharVerificationProps) {
//   const [aadharNumber, setAadharNumber] = useState("")
//   const [otp, setOtp] = useState("")
//   const [refId, setRefId] = useState("")
//   const [isVerifying, setIsVerifying] = useState(false)
//   const [otpSent, setOtpSent] = useState(false)
//   const [isVerified, setIsVerified] = useState(false)
//   const [error, setError] = useState("")
//   const { userId } = useStore();

//   const handleSendOtp = async () => {
//     // Reset error state
//     setError("")
//     setIsVerifying(true)

//     if (!userId) {
//       setIsVerifying(false)
//       setError("User ID not found. Please log in and try again.")
//       return
//     }

//     try {
//       const sanitizedAadhaar = aadharNumber.replace(/-/g, "");
//       const response = await axiosInstance.post(`/verify-aadhaar/?aadhaar_number=${sanitizedAadhaar}`);

//       const data = response.data

//       setIsVerifying(false)

//       if (data.status_code === 200) {
//         setOtpSent(true)
//         setRefId(data.data.ref_id)
//       } else {
//         setError(data.message || "Unable to send OTP. Please check your Aadhar number and try again.")
//       }
//     } catch (err: any) {
//       setIsVerifying(false)
//       setError(
//         err.response?.data?.message || "Failed to connect to the server. Please try again later."
//       )
//     }
//   }

//   const handleVerifyOtp = async () => {
//     // Reset error state
//     setError("")
//     setIsVerifying(true)

//     if (!userId) {
//       setIsVerifying(false)
//       setError("User ID not found. Please log in and try again.")
//       return
//     }

//     try {
//       const response = await axiosInstance.post(`/verify-aadhaar/otp/?user_id=${userId}&ref_id=${refId}&otp=${otp}`)

//       const data = response.data

//       setIsVerifying(false)

//       if (data.status_code === 200 && data.data.valid) {
//         setIsVerified(true)
//       } else {
//         setError(data.message || "Invalid OTP. Please try again.")
//       }
//     } catch (err: any) {
//       setIsVerifying(false)
//       setError(
//         err.response?.data?.message || "Failed to connect to the server. Please try again later."
//       )
//     }
//   }

//   const handleContinue = () => {
//     onComplete()
//   }

//   const isAadharNumberValid = (aadhar: string) => {
//     // Basic Aadhar validation - 12 digits
//     const aadharRegex = /^\d{12}$/
//     return aadharRegex.test(aadhar)
//   }

//   const formatAadharNumber = (value: string) => {
//     const digits = value.replace(/\D/g, "")
//     if (digits.length <= 4) return digits
//     if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`
//     return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`
//   }

//   const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const formattedValue = formatAadharNumber(e.target.value)
//     setAadharNumber(formattedValue)
//     setError("")
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col items-center gap-4 md:flex-row">
//         <div className="flex w-full items-center justify-center md:w-1/3">
//           <div className="rounded-lg bg-primary/10 p-4">
//             <img
//               src="/images/placeholder.svg?height=120&width=120"
//               alt="Aadhar Verification"
//               className="h-24 w-24 object-contain"
//             />
//           </div>
//         </div>
//         <div className="w-full md:w-2/3">
//           <h3 className="text-lg font-medium">Aadhar Verification</h3>
//           <p className="text-sm text-gray-500">
//             Verify your Aadhar number with OTP sent to your registered mobile number.
//           </p>
//         </div>
//       </div>

//       <div className="space-y-4">
//         {!isVerified ? (
//           <>
//             <div className="space-y-2">
//               <Label htmlFor="aadhar-number">Aadhar Number</Label>
//               <Input
//                 id="aadhar-number"
//                 placeholder="XXXX-XXXX-XXXX"
//                 value={aadharNumber}
//                 onChange={handleAadharChange}
//                 maxLength={14}
//                 disabled={otpSent}
//               />
//               {aadharNumber && !isAadharNumberValid(aadharNumber.replace(/-/g, "")) && (
//                 <p className="text-xs text-red-500">Please enter a valid 12-digit Aadhar number</p>
//               )}
//             </div>

//             {!otpSent ? (
//               <Button
//                 className="w-full"
//                 onClick={handleSendOtp}
//                 disabled={!aadharNumber || !isAadharNumberValid(aadharNumber.replace(/-/g, "")) || isVerifying}
//               >
//                 {isVerifying ? "Sending OTP..." : "Send OTP"}
//               </Button>
//             ) : (
//               <>
//                 <div className="space-y-2">
//                   <Label htmlFor="otp">Enter OTP</Label>
//                   <Input
//                     id="otp"
//                     placeholder="6-digit OTP"
//                     value={otp}
//                     onChange={(e) => {
//                       setOtp(e.target.value.replace(/\D/g, ""))
//                       setError("")
//                     }}
//                     maxLength={6}
//                   />
//                   <p className="text-xs text-gray-500">OTP sent to registered mobile number</p>
//                   {error && <p className="text-xs text-red-500">{error}</p>}
//                 </div>

//                 <Button className="w-full" onClick={handleVerifyOtp} disabled={otp.length !== 6 || isVerifying}>
//                   {isVerifying ? "Verifying..." : "Verify OTP"}
//                 </Button>
//               </>
//             )}
//           </>
//         ) : (
//           <>
//             <div className="rounded-md bg-green-50 p-4">
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   <CheckCircle className="h-5 w-5 text-green-500" />
//                 </div>
//                 <div className="ml-3">
//                   <h3 className="text-sm font-medium text-green-800">Aadhar Verified Successfully</h3>
//                   <div className="mt-2 text-sm text-green-700">
//                     <p>Your Aadhar has been verified successfully via OTP.</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-md border p-4">
//               <div>
//                 <p className="text-sm font-medium text-gray-500">Aadhar Number</p>
//                 <p className="font-medium">{aadharNumber}</p>
//               </div>
//             </div>

//             <Button className="w-full" onClick={handleContinue}>
//               Continue to Next Step
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

interface AadharVerificationProps {
  onComplete: () => void;
}

export default function AadharVerification({
  onComplete,
}: AadharVerificationProps) {
  const [aadharNumber, setAadharNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [refId, setRefId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  // const [showOtpField, setShowOtpField] = useState(false)
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const { userId } = useStore();

  // useEffect(() => {
  //   let timer: NodeJS.Timeout
  //   if (otpSent) {
  //     timer = setTimeout(() => {
  //       setShowOtpField(true)
  //     }, 2000)
  //   }
  //   return () => clearTimeout(timer)
  // }, [otpSent])

  const handleSendOtp = async () => {
    setError("");
    setIsVerifying(true);

    if (!userId) {
      setIsVerifying(false);
      setError("User ID not found. Please log in and try again.");
      return;
    }

    try {
      const sanitizedAadhaar = aadharNumber.replace(/-/g, "");
      const response = await axiosInstance.post(
        `/verify-aadhaar/?aadhaar_number=${sanitizedAadhaar}`
      );
      const data = response.data;

      setIsVerifying(false);

      if (data.status_code === 200) {
        setOtpSent(true);
        setRefId(data.data.ref_id);
        // setAadharNumber(sanitizedAadhaar)
      } else {
        setError(
          data.message ||
            "Unable to send OTP. Please check your Aadhar number and try again."
        );
      }
    } catch (err: any) {
      setIsVerifying(false);
      setError(
        err.response?.data?.message ||
          "Failed to connect to the server. Please try again later."
      );
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setIsVerifying(true);

    if (!userId) {
      setIsVerifying(false);
      setError("User ID not found. Please log in and try again.");
      return;
    }

    try {
      const sanitizedAadhaar = aadharNumber.replace(/-/g, "");

      const response = await axiosInstance.post(
        `/verify-aadhaar/otp/?user_id=${userId}&ref_id=${refId}&otp=${otp}&aadhaar_number=${sanitizedAadhaar}`
      );
      const data = response.data;

      setIsVerifying(false);

      if (data.status_code === 200) {
        setIsVerified(true);
        setOtp(""); // Clear OTP input after successful verification
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err: any) {
      setIsVerifying(false);
      setError(
        err.response?.data?.message ||
          "Internal server error. Please try again."
      );
    }
  };

  const handleNext = () => {
    onComplete();
  };

  const isAadharNumberValid = (aadhar: string) => {
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadhar);
  };

  const formatAadharNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatAadharNumber(e.target.value);
    setAadharNumber(formattedValue);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="flex w-full items-center justify-center md:w-1/3">
          <div className="rounded-lg bg-primary/10 p-4">
            <img
              src="/images/placeholder.svg?height=120&width=120"
              alt="Aadhar Verification"
              className="h-24 w-24 object-contain"
            />
          </div>
        </div>
        <div className="w-full md:w-2/3">
          <h3 className="text-lg font-medium">Aadhar Verification</h3>
          <p className="text-sm text-gray-500">
            Verify your Aadhar number with OTP sent to your registered mobile
            number.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {!isVerified ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="aadhar-number">Aadhar Number</Label>
              <Input
                id="aadhar-number"
                placeholder="XXXX-XXXX-XXXX"
                value={aadharNumber}
                onChange={handleAadharChange}
                maxLength={14}
                disabled={otpSent}
              />
              {aadharNumber &&
                !isAadharNumberValid(aadharNumber.replace(/-/g, "")) && (
                  <p className="text-xs text-red-500">
                    Please enter a valid 12-digit Aadhar number
                  </p>
                )}
            </div>

            {!otpSent ? (
              <Button
                className="w-full"
                onClick={handleSendOtp}
                disabled={
                  !aadharNumber ||
                  !isAadharNumberValid(aadharNumber.replace(/-/g, "")) ||
                  isVerifying
                }
              >
                {isVerifying ? "Sending OTP..." : "Send OTP"}
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>

                  <Input
                    id="otp"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ""));

                      setError("");
                    }}
                    maxLength={6}
                    disabled={isVerified}
                  />

                  <p className="text-xs text-gray-500">
                    OTP sent to registered mobile number
                  </p>

                  {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || isVerifying || isVerified}
                >
                  {isVerifying ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Aadhar Verified Successfully
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your Aadhar has been verified successfully via OTP.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Aadhar Number
                </p>
                <p className="font-medium">{aadharNumber}</p>
              </div>
            </div>

            <Button className="w-full" onClick={handleNext}>
              Completed Go to Next Step
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
