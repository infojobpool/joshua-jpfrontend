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
import useStore from "../../lib/Zustand";
import { verificationApiFailureMessage, verificationFailureMessage } from "@/lib/slowApiErrors";
import { postVerificationWithRetry } from "@/lib/verificationApi";

interface AadharVerificationProps {
  onComplete: () => void;
}

function resolveEffectiveUserId(storeUserId: string | null): string | null {
  if (storeUserId) return storeUserId;
  try {
    const local = localStorage.getItem("user");
    if (!local) return null;
    const parsed = JSON.parse(local);
    return String(parsed?.id || parsed?.userId || parsed?.user_id || "").trim() || null;
  } catch {
    return null;
  }
}

function extractAadhaarRefId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = root.data;
  const nested =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;

  const candidates = [
    nested?.ref_id,
    nested?.refId,
    nested?.reference_id,
    root.ref_id,
    root.refId,
    typeof data === "string" || typeof data === "number" ? data : null,
  ];

  for (const candidate of candidates) {
    if (candidate == null) continue;
    const value = String(candidate).trim();
    if (value) return value;
  }
  return null;
}

function validationItemMessage(item: unknown): string | null {
  if (typeof item === "string" && item.trim()) return item.trim();
  if (!item || typeof item !== "object") return null;
  const row = item as { msg?: string; message?: string };
  const msg = row.msg || row.message;
  return typeof msg === "string" && msg.trim() ? msg.trim() : null;
}

function formatApiErrorPayload(payload: unknown, fallback: string): string {
  if (payload == null) return fallback;
  if (typeof payload === "string") return payload.trim() || fallback;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const msg = validationItemMessage(item);
      if (msg) return msg;
    }
    return fallback;
  }
  if (typeof payload !== "object") return fallback;

  const root = payload as Record<string, unknown>;

  const message = root.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  if (Array.isArray(message)) {
    for (const item of message) {
      const msg = validationItemMessage(item);
      if (msg) return msg;
    }
  } else if (message && typeof message === "object") {
    const msg = validationItemMessage(message);
    if (msg) return msg;
  }

  const detail = root.detail;
  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    for (const item of detail) {
      const msg = validationItemMessage(item);
      if (msg) return msg;
    }
  } else if (detail && typeof detail === "object") {
    const msg = validationItemMessage(detail);
    if (msg) return msg;
  }

  if (root.data != null) {
    const nested = formatApiErrorPayload(root.data, "");
    if (nested) return nested;
  }

  return fallback;
}

function formatAxiosError(err: unknown, fallback: string): string {
  const anyErr = err as { message?: string };
  if (anyErr.message === "Too many requests - please slow down") {
    return "Too many requests. Please wait a few seconds and try again.";
  }
  return verificationFailureMessage(err, fallback);
}

function isOtpSendSuccessful(payload: unknown, httpStatus: number): boolean {
  if (!payload || typeof payload !== "object") return httpStatus >= 200 && httpStatus < 300;
  const root = payload as Record<string, unknown>;
  if (root.status_code === 200) return true;
  const message = formatApiErrorPayload(payload, "").toLowerCase();
  return (
    httpStatus >= 200 &&
    httpStatus < 300 &&
    (message.includes("otp") || message.includes("success") || message.includes("sent"))
  );
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
  const [isSessionExpired, setIsSessionExpired] = useState(false);
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
    setIsSessionExpired(false);

    const effectiveUserId = resolveEffectiveUserId(userId);
    if (!effectiveUserId) {
      setIsVerifying(false);
      setError("User ID not found. Please log in and try again.");
      return;
    }

    try {
      const sanitizedAadhaar = aadharNumber.replace(/-/g, "");
      console.log("🆔 [Aadhar] Sending OTP", { userId: effectiveUserId, sanitizedAadhaar });

      let response;
      // Match PAN flow: user_id + aadhaar_number as query params (JSON body returns 422).
      const sendOtpUrl = `/verify-aadhaar/?user_id=${encodeURIComponent(effectiveUserId)}&aadhaar_number=${encodeURIComponent(sanitizedAadhaar)}`;
      try {
        response = await postVerificationWithRetry(sendOtpUrl);
      } catch (postError: any) {
        const status = postError.response?.status;
        if (status === 404 || status === 405) {
          console.log("🆔 [Aadhar] Query POST failed, trying JSON body");
          response = await postVerificationWithRetry(`/verify-aadhaar/`, {
            user_id: effectiveUserId,
            aadhaar_number: sanitizedAadhaar,
          });
        } else {
          throw postError;
        }
      }

      const data = response.data;
      console.log("🆔 [Aadhar] OTP response:", data);

      setIsVerifying(false);

      const refIdValue = extractAadhaarRefId(data);
      if (isOtpSendSuccessful(data, response.status) && refIdValue) {
        setOtpSent(true);
        setRefId(refIdValue);
        setOtp("");
      } else if (isOtpSendSuccessful(data, response.status) && !refIdValue) {
        setError(
          "OTP may have been sent, but the session reference was missing. Please tap Send OTP again."
        );
      } else {
        setError(
          verificationApiFailureMessage(
            data,
            "Unable to send OTP. Please check your Aadhar number and try again."
          )
        );
      }
    } catch (err: any) {
      console.error("❌ [Aadhar] OTP send error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      setIsVerifying(false);
      setError(
        formatAxiosError(err, "Failed to connect to the server. Please try again later.")
      );
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setIsVerifying(true);

    const effectiveUserId = resolveEffectiveUserId(userId);
    if (!effectiveUserId) {
      setIsVerifying(false);
      setError("User ID not found. Please log in and try again.");
      return;
    }

    try {
      const sanitizedAadhaar = aadharNumber.replace(/-/g, "");
      console.log("🆔 [Aadhar] Verifying OTP", {
        userId: effectiveUserId,
        refId,
        otp,
        sanitizedAadhaar,
      });

      let response;
      const otpQuery = `/verify-aadhaar/otp/?user_id=${encodeURIComponent(effectiveUserId)}&ref_id=${encodeURIComponent(refId)}&otp=${encodeURIComponent(otp)}&aadhaar_number=${encodeURIComponent(sanitizedAadhaar)}`;
      try {
        response = await postVerificationWithRetry(otpQuery);
      } catch (postError: any) {
        const status = postError.response?.status;
        if (status === 404 || status === 405) {
          console.log("🆔 [Aadhar] OTP query POST failed, trying JSON body");
          response = await postVerificationWithRetry(`/verify-aadhaar/otp/`, {
            user_id: effectiveUserId,
            ref_id: refId,
            otp,
            aadhaar_number: sanitizedAadhaar,
          });
        } else {
          throw postError;
        }
      }

      const data = response.data;
      console.log("🆔 [Aadhar] OTP verify response:", data);

      setIsVerifying(false);

      // Check multiple success conditions - API might return success in different formats
      const responseMessage = formatApiErrorPayload(data, "").toLowerCase();
      const isSuccess = 
        (data.status_code === 200 && data.data?.valid === true) ||
        (data.status_code === 200 && data.data?.valid === "true") ||
        (data.status_code === 200 && data.valid === true) ||
        (data.status_code === 200 && responseMessage.includes("success")) ||
        (data.status_code === 200 && responseMessage.includes("verified")) ||
        (response.status === 200 && data.status_code === 200);

      if (isSuccess) {
        console.log("✅ Aadhaar verification successful, setting verified state");
        setIsVerified(true);
        setOtp(""); // Clear OTP input after successful verification

        // Update user verification_status so Profile shows Verified (backend updates; sync localStorage)
        try {
          const local = localStorage.getItem("user");
          if (local) {
            const parsed = JSON.parse(local);
            parsed.verification_status = Math.max(Number(parsed.verification_status) || 0, 2);
            localStorage.setItem("user", JSON.stringify(parsed));
            useStore.setState({ user: { ...parsed, verification_status: parsed.verification_status } });
          }
        } catch {}

        // Automatically proceed to next step after a short delay
        setTimeout(() => {
          console.log("✅ Auto-proceeding to next step after Aadhaar verification");
          handleNext();
        }, 1500); // 1.5 second delay to show success message
      } else {
        console.warn("⚠️ Verification response doesn't indicate success:", data);
        setError(
          verificationApiFailureMessage(data, "Invalid OTP. Please try again.")
        );
      }
    } catch (err: any) {
      console.error("❌ [Aadhar] OTP verify error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      setIsVerifying(false);
      
      // Check for session expired error from Cashfree API
      const errorData = err.response?.data;
      const errorMessage = formatAxiosError(err, "");
      const errorDetails = errorData?.data?.details || errorData?.data?.error || "";
      
      // Check if error contains "Session expired" or "session expired" or "verification_failed"
      const isSessionExpired = 
        errorMessage.toLowerCase().includes("session expired") ||
        errorMessage.toLowerCase().includes("expired") ||
        (typeof errorDetails === "string" && errorDetails.toLowerCase().includes("session expired")) ||
        (errorData?.data?.error && typeof errorData.data.error === "object" && 
         JSON.stringify(errorData.data.error).toLowerCase().includes("session expired"));
      
      if (isSessionExpired) {
        // Session expired - allow user to request new OTP
        setIsSessionExpired(true);
        setError(
          "OTP session has expired. Please request a new OTP."
        );
        // Reset OTP state so user can request a new one
        setOtpSent(false);
        setOtp("");
        setRefId("");
        console.log("🔄 OTP session expired - resetting state for new OTP request");
      } else {
        setIsSessionExpired(false);
        setError(
          errorMessage || "Invalid OTP or verification failed. Please try again."
        );
      }
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

            {!otpSent || isSessionExpired ? (
              <>
                {error && (
                  <p className="text-xs text-red-500" role="alert">
                    {formatApiErrorPayload(error, "Unable to send OTP. Please try again.")}
                  </p>
                )}
                {isVerifying && (
                  <p className="text-xs text-muted-foreground">
                    Sending OTP to your Aadhaar-linked mobile. This can take up to 2 minutes — please keep this screen open.
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={handleSendOtp}
                  disabled={
                    !aadharNumber ||
                    !isAadharNumberValid(aadharNumber.replace(/-/g, "")) ||
                    isVerifying
                  }
                >
                  {isVerifying ? "Sending OTP..." : isSessionExpired ? "Request New OTP" : "Send OTP"}
                </Button>
              </>
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

                  {error && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-500">
                        {formatApiErrorPayload(error, "Verification failed. Please try again.")}
                      </p>
                      {isSessionExpired && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleSendOtp}
                          disabled={isVerifying}
                        >
                          {isVerifying ? "Sending..." : "Request New OTP"}
                        </Button>
                      )}
                    </div>
                  )}
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

            <Button 
              className="w-full" 
              onClick={() => {
                console.log("✅ User clicked 'Go to Next Step' after Aadhaar verification");
                handleNext();
              }}
            >
              Continue to Next Step
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
