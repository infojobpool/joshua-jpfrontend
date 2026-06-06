// "use client"
 
// import { useState } from "react"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
// import { Button } from "../../components/ui/button"
// import PanVerification from "../../components/verification/pan-verification"
// import AadharVerification from "../../components/verification/aadhar-verification"
// import BankVerification from "../../components/verification/bank-verification"
// import VerificationComplete from "../../components/verification/verification-complete"
// import VerificationIntro from "../../components/verification/verification-intro"
// import VerticalStepIndicator from "../../components/verification/vertical-step-indicator"
 
// export default function VerificationFlow() {
//   const [currentStep, setCurrentStep] = useState(0) // Start with intro step (0)
//   const [verificationStatus, setVerificationStatus] = useState({
//     pan: { completed: false, skipped: false },
//     aadhar: { completed: false, skipped: false },
//     bank: { completed: false, skipped: false },
//   })
 
//   const totalSteps = 5 // Intro + 3 verification steps + completion
 
//   const handleNext = () => {
//     if (currentStep < totalSteps - 1) {
//       setCurrentStep(currentStep + 1)
//     }
//   }
 
 
 
//   const handleSkip = () => {
//     if (currentStep === 1) {
//       setVerificationStatus({
//         ...verificationStatus,
//         pan: { completed: false, skipped: true },
//       })
//     } else if (currentStep === 2) {
//       setVerificationStatus({
//         ...verificationStatus,
//         aadhar: { completed: false, skipped: true },
//       })
//     } else if (currentStep === 3) {
//       setVerificationStatus({
//         ...verificationStatus,
//         bank: { completed: false, skipped: true },
//       })
//     }
//     handleNext()
//   }
 
//   const handleComplete = (step: "pan" | "aadhar" | "bank") => {
//     setVerificationStatus({
//       ...verificationStatus,
//       [step]: { completed: true, skipped: false },
//     })
//     handleNext()
//      if (step === "pan" || step === "aadhar") {
//      await new Promise((resolve) => setTimeout(resolve, 30000)) // 30 seconds delay
//   }
//   }
 
//   const steps = [
//     { name: "Introduction", status: { completed: currentStep > 0, skipped: false } },
//     { name: "PAN Card", status: verificationStatus.pan },
//     { name: "Aadhar", status: verificationStatus.aadhar },
//     { name: "Bank Details", status: verificationStatus.bank },
//     { name: "Complete", status: { completed: false, skipped: false } },
//   ]
 
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
//       <Card className={`w-full ${currentStep === 4 ? "max-w-2xl" : "max-w-4xl"}`}>
//         <CardHeader>
//           <CardTitle className="text-2xl font-bold">Account Verification</CardTitle>
//           <CardDescription>Please complete the verification process to access all features</CardDescription>
//         </CardHeader>
//         <CardContent>
//           {currentStep === 4 ? (
//             // Full width for completion screen
//             <VerificationComplete verificationStatus={verificationStatus} />
//           ) : (
//             // Side-by-side layout for verification steps
//             <div className="flex flex-col gap-6 md:flex-row">
//               <div className="w-full md:w-1/3">
//                 <VerticalStepIndicator currentStep={currentStep} steps={steps} />
//               </div>
//               <div className="w-full md:w-2/3">
//                 {currentStep === 0 && <VerificationIntro onStart={handleNext} />}
//                 {currentStep === 1 && <PanVerification onComplete={() => handleComplete("pan")} />}
//                 {currentStep === 2 && <AadharVerification onComplete={() => handleComplete("aadhar")} />}
//                 {currentStep === 3 && <BankVerification onComplete={() => handleComplete("bank")} />}
//               </div>
//             </div>
//           )}
//         </CardContent>
//         {currentStep !== 4 && (
//           <CardFooter className="flex justify-between">
//             {/* <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
//               Back
//             </Button> */}
//             <div className="flex gap-2">
//               {currentStep > 0 && currentStep < totalSteps - 1 && (
//                 <Button variant="ghost" onClick={handleSkip}>
//                   Skip for now
//                 </Button>
//               )}
//               {currentStep === 0 && <Button onClick={handleNext}>Get Started</Button>}
//             </div>
//           </CardFooter>
//         )}
//       </Card>
//     </div>
//   )
// }

// "use client"

// import { useEffect, useState } from "react"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "../../components/ui/card"
// import { Button } from "../../components/ui/button"
// import PanVerification from "../../components/verification/pan-verification"
// import AadharVerification from "../../components/verification/aadhar-verification"
// import BankVerification from "../../components/verification/bank-verification"
// import VerificationComplete from "../../components/verification/verification-complete"
// import VerificationIntro from "../../components/verification/verification-intro"
// import VerticalStepIndicator from "../../components/verification/vertical-step-indicator"

// export default function VerificationFlow() {
//   const [currentStep, setCurrentStep] = useState(0)
//   const [isWaiting, setIsWaiting] = useState(false)
//   const [timer, setTimer] = useState(30)
//   const [verificationStatus, setVerificationStatus] = useState({
//     pan: { completed: false, skipped: false },
//     aadhar: { completed: false, skipped: false },
//     bank: { completed: false, skipped: false },
//   })

//   const totalSteps = 5

//   const handleNext = () => {
//     if (currentStep < totalSteps - 1) {
//       setCurrentStep((prev) => prev + 1)
//     }
//   }

//   const handleSkip = () => {
//     if (currentStep === 1) {
//       setVerificationStatus((prev) => ({
//         ...prev,
//         pan: { completed: false, skipped: true },
//       }))
//     } else if (currentStep === 2) {
//       setVerificationStatus((prev) => ({
//         ...prev,
//         aadhar: { completed: false, skipped: true },
//       }))
//     } else if (currentStep === 3) {
//       setVerificationStatus((prev) => ({
//         ...prev,
//         bank: { completed: false, skipped: true },
//       }))
//     }
//     handleNext()
//   }

//   const handleComplete = async (step: "pan" | "aadhar" | "bank") => {
//     setVerificationStatus((prev) => ({
//       ...prev,
//       [step]: { completed: true, skipped: false },
//     }))

//     if (step === "pan" || step === "aadhar") {
//       setIsWaiting(true)
//       setTimer(30)
//     } else {
//       handleNext()
//     }
//   }

//   // Countdown effect
//   useEffect(() => {
//     if (isWaiting && timer > 0) {
//       const interval = setInterval(() => {
//         setTimer((prev) => prev - 1)
//       }, 1000)
//       return () => clearInterval(interval)
//     } else if (isWaiting && timer === 0) {
//       setIsWaiting(false)
//       handleNext()
//     }
//   }, [isWaiting, timer])

//   const steps = [
//     { name: "Introduction", status: { completed: currentStep > 0, skipped: false } },
//     { name: "PAN Card", status: verificationStatus.pan },
//     { name: "Aadhar", status: verificationStatus.aadhar },
//     { name: "Bank Details", status: verificationStatus.bank },
//     { name: "Complete", status: { completed: false, skipped: false } },
//   ]

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
//       <Card className={`w-full ${currentStep === 4 ? "max-w-2xl" : "max-w-4xl"}`}>
//         <CardHeader>
//           <CardTitle className="text-2xl font-bold">Account Verification</CardTitle>
//           <CardDescription>
//             Please complete the verification process to access all features
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {isWaiting ? (
//             <div className="flex flex-col items-center justify-center py-12">
//               <h2 className="text-lg font-medium mb-2">Please wait for the next step</h2>
//               <p className="text-muted-foreground text-sm">Continuing in {timer} seconds...</p>
//             </div>
//           ) : currentStep === 4 ? (
//             <VerificationComplete verificationStatus={verificationStatus} />
//           ) : (
//             <div className="flex flex-col gap-6 md:flex-row">
//               <div className="w-full md:w-1/3">
//                 <VerticalStepIndicator currentStep={currentStep} steps={steps} />
//               </div>
//               <div className="w-full md:w-2/3">
//                 {currentStep === 0 && <VerificationIntro onStart={handleNext} />}
//                 {currentStep === 1 && <PanVerification onComplete={() => handleComplete("pan")} />}
//                 {currentStep === 2 && (
//                   <AadharVerification onComplete={() => handleComplete("aadhar")} />
//                 )}
//                 {currentStep === 3 && (
//                   <BankVerification onComplete={() => handleComplete("bank")} />
//                 )}
//               </div>
//             </div>
//           )}
//         </CardContent>
//         {currentStep !== 4 && !isWaiting && (
//           <CardFooter className="flex justify-between">
//             <div className="flex gap-2">
//               {currentStep > 0 && currentStep < totalSteps - 1 && (
//                 <Button variant="ghost" onClick={handleSkip}>
//                   Skip for now
//                 </Button>
//               )}
//               {currentStep === 0 && <Button onClick={handleNext}>Get Started</Button>}
//             </div>
//           </CardFooter>
//         )}
//       </Card>
//     </div>
//   )
// }


"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import PanVerification from "../../components/verification/pan-verification"
import AadharVerification from "../../components/verification/aadhar-verification"
import VerificationComplete from "../../components/verification/verification-complete"
import VerificationIntro from "../../components/verification/verification-intro"
import VerticalStepIndicator from "../../components/verification/vertical-step-indicator"
import { TrustBadges } from "../../components/TrustBadges"
import axiosInstance from "../../lib/axiosInstance"
import useStore from "../../lib/Zustand"
import { CheckCircle } from "lucide-react"
import { WelcomeBonusProcessHint } from "@/components/promo/WelcomeBonusProcessHint"
import {
  getPayoutEligibilityStats,
  type PayoutEligibilityItem,
} from "@/lib/payoutProfileCompletion"

export default function VerificationFlow() {
  const { userId } = useStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isWaiting, setIsWaiting] = useState(false)
  const [timer, setTimer] = useState(30)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState({
    pan: { completed: false, skipped: false },
    aadhar: { completed: false, skipped: false },
  })
  const [payoutPreview, setPayoutPreview] = useState<{
    percent: number;
    completed: number;
    total: number;
    remaining: number;
    missing: PayoutEligibilityItem[];
  } | null>(null)

  const totalSteps = 4 // Intro, PAN, Aadhar, Complete

  const loadPayoutPreview = useCallback(async (effectiveUserId: string) => {
    try {
      const cacheBuster = `?user_id=${effectiveUserId}&_t=${Date.now()}`;
      const [response, walletRes] = await Promise.all([
        axiosInstance.get(`/profile${cacheBuster}`),
        axiosInstance.get(`/wallet?user_id=${effectiveUserId}&limit=1`),
      ]);
      const data = response.data;
      const payload = data?.data ?? data;
      const wd = walletRes.data?.data ?? walletRes.data;
      const stats = getPayoutEligibilityStats(wd, payload);
      setPayoutPreview(stats);
    } catch {
      setPayoutPreview(null);
    }
  }, []);

  // Fetch verification status on mount
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      // Derive userId from localStorage as a fallback for slow hydration
      let effectiveUserId = userId as any;
      if (!effectiveUserId) {
        try {
          const local = localStorage.getItem("user");
          if (local) {
            const parsed = JSON.parse(local);
            effectiveUserId = parsed?.id || parsed?.userId || parsed?.user_id;
          }
        } catch {}
      }
      
      if (!effectiveUserId) {
        setIsLoadingStatus(false);
        return;
      }

      try {
        const cacheBuster = `?user_id=${effectiveUserId}&_t=${Date.now()}`;
        const response = await axiosInstance.get(`/profile${cacheBuster}`);
        const data = response.data;
        const payload = data?.data ?? data;

        await loadPayoutPreview(effectiveUserId);

        // Check verification status from API
        const apiVerificationStatus =
          payload?.verification_status ??
          payload?.verificationStatus ??
          data.verification_status ??
          data.verificationStatus ??
          data.data?.verification_status ??
          null;
        
        console.log("🔍 Verification Page - API Response:", {
          verification_status: apiVerificationStatus,
          pan_verified: data.pan_verified,
          aadhar_verified: data.aadhar_verified,
        });

        if (apiVerificationStatus !== null && typeof apiVerificationStatus === 'number') {
          // Set verification status based on API response
          // verification_status: 1 = PAN, 2 = Aadhar, 3 = Bank
          setVerificationStatus({
            pan: { completed: apiVerificationStatus >= 1, skipped: false },
            aadhar: { completed: apiVerificationStatus >= 2, skipped: false },
          });
          
          // If both are already verified, skip to completion step
          if (apiVerificationStatus >= 2) {
            setCurrentStep(3); // Go directly to completion step
          } else if (apiVerificationStatus >= 1) {
            // PAN is verified, skip to Aadhar step
            setCurrentStep(2);
          }
        } else {
          // Check explicit verification flags if verification_status is not available
          const panVerified =
            (payload as { pan_verified?: boolean; pan_status?: string })?.pan_verified === true ||
            data.pan_verified === true ||
            (payload as { pan_status?: string })?.pan_status === "verified" ||
            (payload as { pan_status?: string })?.pan_status === "approved" ||
            data.pan_status === "verified" ||
            data.pan_status === "approved";
          const aadharVerified =
            (payload as { aadhar_verified?: boolean; aadhaar_verified?: boolean })?.aadhar_verified === true ||
            (payload as { aadhaar_verified?: boolean })?.aadhaar_verified === true ||
            data.aadhar_verified === true ||
            data.aadhaar_verified === true ||
            (payload as { aadhar_status?: string })?.aadhar_status === "verified" ||
            (payload as { aadhar_status?: string })?.aadhar_status === "approved" ||
            data.aadhar_status === "verified" ||
            data.aadhar_status === "approved";
          
          if (panVerified || aadharVerified) {
            setVerificationStatus({
              pan: { completed: panVerified, skipped: false },
              aadhar: { completed: aadharVerified, skipped: false },
            });
            
            if (aadharVerified) {
              setCurrentStep(3); // Both verified, go to completion
            } else if (panVerified) {
              setCurrentStep(2); // PAN verified, go to Aadhar step
            }
          }
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch verification status:", error);
        // Continue with default state (not verified)
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchVerificationStatus();
  }, [userId, loadPayoutPreview]);

  useEffect(() => {
    if (currentStep !== 3) return;
    let uid = userId as string | undefined;
    if (!uid) {
      try {
        const local = localStorage.getItem("user");
        if (local) {
          const parsed = JSON.parse(local);
          uid = parsed?.id || parsed?.userId || parsed?.user_id;
        }
      } catch {}
    }
    if (!uid) return;
    void loadPayoutPreview(String(uid));
  }, [currentStep, userId, loadPayoutPreview]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    if (currentStep === 1) {
      setVerificationStatus((prev) => ({
        ...prev,
        pan: { completed: false, skipped: true },
      }))
    } else if (currentStep === 2) {
      setVerificationStatus((prev) => ({
        ...prev,
        aadhar: { completed: false, skipped: true },
      }))
    }
    handleNext()
  }

  const handleComplete = async (step: "pan" | "aadhar") => {
    console.log(`✅ Verification step completed: ${step}`);
    setVerificationStatus((prev) => ({
      ...prev,
      [step]: { completed: true, skipped: false },
    }))

    // For Aadhaar, move to completion step immediately (no waiting)
    if (step === "aadhar") {
      console.log("✅ Aadhaar verified - moving to completion step");
      // Refresh verification status from API first
      try {
        let effectiveUserId = userId as any;
        if (!effectiveUserId) {
          const local = localStorage.getItem("user");
          if (local) {
            const parsed = JSON.parse(local);
            effectiveUserId = parsed?.id || parsed?.userId || parsed?.user_id;
          }
        }
        if (effectiveUserId) {
          const cacheBuster = `?user_id=${effectiveUserId}&_t=${Date.now()}`;
          const response = await axiosInstance.get(`/profile${cacheBuster}`);
          const data = response.data;
          const apiVerificationStatus = data.verification_status ?? data.verificationStatus ?? data?.data?.verification_status ?? null;
          const statusNum = apiVerificationStatus != null ? Number(apiVerificationStatus) : null;
          if (statusNum !== null && !isNaN(statusNum)) {
            setVerificationStatus({
              pan: { completed: statusNum >= 1, skipped: false },
              aadhar: { completed: statusNum >= 2, skipped: false },
            });
            // Sync to localStorage so Profile page shows correct status
            try {
              const local = localStorage.getItem("user");
              if (local) {
                const parsed = JSON.parse(local);
                parsed.verification_status = statusNum;
                localStorage.setItem("user", JSON.stringify(parsed));
                useStore.setState({ user: { ...parsed, verification_status: statusNum } });
              }
            } catch {}
          }
        }
      } catch (error) {
        console.error("Failed to refresh verification status:", error);
      }

      // Move to completion step immediately
      setTimeout(() => {
        console.log("✅ Moving to completion step (step 3)");
        setCurrentStep(3);
      }, 1000); // Short 1 second delay to show success message
    } else {
      // For PAN, show waiting timer
      setIsWaiting(true)
      setTimer(30)
      
      // Refresh verification status from API after completion
      setTimeout(async () => {
        try {
          let effectiveUserId = userId as any;
          if (!effectiveUserId) {
            const local = localStorage.getItem("user");
            if (local) {
              const parsed = JSON.parse(local);
              effectiveUserId = parsed?.id || parsed?.userId || parsed?.user_id;
            }
          }
          if (effectiveUserId) {
            const cacheBuster = `?user_id=${effectiveUserId}&_t=${Date.now()}`;
            const response = await axiosInstance.get(`/profile${cacheBuster}`);
            const data = response.data;
            const apiVerificationStatus = data.verification_status ?? data.verificationStatus ?? data?.data?.verification_status ?? null;
            const statusNum = apiVerificationStatus != null ? Number(apiVerificationStatus) : null;
            if (statusNum !== null && !isNaN(statusNum)) {
              setVerificationStatus({
                pan: { completed: statusNum >= 1, skipped: false },
                aadhar: { completed: statusNum >= 2, skipped: false },
              });
              // Sync to localStorage so Profile page shows correct status
              try {
                const local = localStorage.getItem("user");
                if (local) {
                  const parsed = JSON.parse(local);
                  parsed.verification_status = statusNum;
                  localStorage.setItem("user", JSON.stringify(parsed));
                  useStore.setState({ user: { ...parsed, verification_status: statusNum } });
                }
              } catch {}
            }
          }
        } catch (error) {
          console.error("Failed to refresh verification status:", error);
        }
      }, 2000); // Wait 2 seconds for backend to process
    }
  }

  // Countdown effect
  useEffect(() => {
    if (isWaiting && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else if (isWaiting && timer === 0) {
      setIsWaiting(false)
      handleNext()
    }
  }, [isWaiting, timer])

  const steps = [
    { name: "Introduction", status: { completed: currentStep > 0, skipped: false } },
    { name: "PAN Card", status: verificationStatus.pan },
    { name: "Aadhar", status: verificationStatus.aadhar },
    { name: "Complete", status: { completed: false, skipped: false } },
  ]

  // Show loading state while fetching verification status
  if (isLoadingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">Checking verification status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 pb-28 md:pb-8">
      <Card className={`w-full ${currentStep === 3 ? "max-w-2xl" : "max-w-4xl"}`}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Verification</CardTitle>
          <CardDescription>
            Please complete the verification process to access all features
          </CardDescription>
          {payoutPreview && payoutPreview.remaining > 0 && (
            <WelcomeBonusProcessHint
              percent={payoutPreview.percent}
              label={`${payoutPreview.completed} of ${payoutPreview.total} steps toward ₹100 bonus · ${payoutPreview.remaining} left`}
              className="mt-4 pr-14 md:pr-3"
            />
          )}
        </CardHeader>
        <CardContent>
          {isWaiting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <h2 className="text-lg font-medium mb-2">Please wait for the next step</h2>
              <p className="text-muted-foreground text-sm">Continuing in {timer} seconds...</p>
            </div>
          ) : currentStep === 3 ? (
            <VerificationComplete
              verificationStatus={verificationStatus}
              missingPayoutItems={payoutPreview?.missing ?? []}
            />
          ) : (
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="w-full md:w-1/3 space-y-4">
                <VerticalStepIndicator currentStep={currentStep} steps={steps} />
                <TrustBadges
                  heading="Your details are safe"
                  subtext="Encrypted, compliant & protected"
                  variant="strip"
                />
              </div>
              <div className="w-full md:w-2/3">
                {currentStep === 0 && <VerificationIntro onStart={handleNext} />}
                {currentStep === 1 && (
                  verificationStatus.pan.completed ? (
                    <div className="space-y-4">
                      <div className="rounded-md bg-green-50 p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <h3 className="text-sm font-medium text-green-800">PAN Already Verified</h3>
                            <p className="text-sm text-green-700 mt-1">Your PAN has already been verified.</p>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleNext}>
                        Continue to Aadhar Verification
                      </Button>
                    </div>
                  ) : (
                    <PanVerification onComplete={() => handleComplete("pan")} />
                  )
                )}
                {currentStep === 2 && (
                  verificationStatus.aadhar.completed ? (
                    <div className="space-y-4">
                      <div className="rounded-md bg-green-50 p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <h3 className="text-sm font-medium text-green-800">Aadhar Already Verified</h3>
                            <p className="text-sm text-green-700 mt-1">Your Aadhar has already been verified.</p>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => setCurrentStep(3)}>
                        View Verification Summary
                      </Button>
                    </div>
                  ) : (
                    <AadharVerification onComplete={() => handleComplete("aadhar")} />
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
        {currentStep !== 3 && !isWaiting && (
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && currentStep < totalSteps - 1 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
              )}
              {currentStep === 0 && <Button onClick={handleNext}>Get Started</Button>}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}