// "use client"

// import { useState, useEffect } from "react"
// import { CheckCircle2, Award, ArrowRight } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import Link from "next/link"
// import { motion } from "framer-motion"

// interface VerificationCompleteProps {
//   verificationStatus: {
//     pan: { completed: boolean; skipped: boolean }
//     aadhar: { completed: boolean; skipped: boolean }
//     bank: { completed: boolean; skipped: boolean }
//   }
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   accountType: string;
//   isLoggedIn: boolean;
// }

// export default function VerificationComplete({ verificationStatus }: VerificationCompleteProps) {
//   const [user, setUser] = useState<User | null>(null);

//    // Check authentication
//    useEffect(() => {
//      const storedUser = localStorage.getItem("user");
//      if (storedUser) {
//        try {
//          const parsedUser: User = JSON.parse(storedUser);
//          setUser(parsedUser);
//        } catch (error) {
//          console.error("Failed to parse user from localStorage:", error);
         
//        }
//      } else {
//       console.log("user not found")
//      }
    
//    }, []);

//   const allCompleted =
//     verificationStatus.pan.completed && verificationStatus.aadhar.completed && verificationStatus.bank.completed

//   const someCompleted =
//     (verificationStatus.pan.completed || verificationStatus.aadhar.completed || verificationStatus.bank.completed) &&
//     !allCompleted

//   const allSkipped =
//     verificationStatus.pan.skipped && verificationStatus.aadhar.skipped && verificationStatus.bank.skipped

//   // Animation variants for the checkmark and content
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         when: "beforeChildren",
//         staggerChildren: 0.3,
//       },
//     },
//   }

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 300, damping: 24 },
//     },
//   }

//   const checkVariants = {
//     hidden: { scale: 0, opacity: 0 },
//     visible: {
//       scale: 1,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 300, damping: 20 },
//     },
//   }

//   return (
//     <motion.div
//       className="flex flex-col items-center justify-center space-y-6 py-6"
//       variants={containerVariants}
//       initial="hidden"
//       animate="visible"
//     >
//       {allCompleted && (
//         <>
//           <motion.div
//             className="relative flex h-32 w-32 items-center justify-center rounded-full bg-green-100"
//             variants={checkVariants}
//           >
//             <CheckCircle2 className="h-20 w-20 text-green-600" />
//             <div className="absolute -right-2 -top-2 rounded-full bg-primary p-2">
//               <Award className="h-6 w-6 text-white" />
//             </div>
//           </motion.div>

//           <motion.div className="text-center" variants={itemVariants}>
//             <h3 className="text-2xl font-bold text-green-700">All Set, {user?.name}!</h3>
//             <p className="mt-2 text-lg text-gray-700">You've successfully completed all verification steps.</p>
//             <p className="mt-1 text-gray-600">
//               Your account is now fully verified and you have access to all features.
//             </p>
//           </motion.div>

//           <motion.div className="w-full max-w-md space-y-3" variants={itemVariants}>
//             <div className="rounded-lg border bg-white p-4 shadow-sm">
//               <div className="flex items-start space-x-3">
//                 <div className="rounded-full bg-green-100 p-1">
//                   <CheckCircle2 className="h-5 w-5 text-green-600" />
//                 </div>
//                 <div>
//                   <h4 className="font-medium">PAN Card Verification</h4>
//                   <p className="text-sm text-gray-600">Your PAN details have been verified</p>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-lg border bg-white p-4 shadow-sm">
//               <div className="flex items-start space-x-3">
//                 <div className="rounded-full bg-green-100 p-1">
//                   <CheckCircle2 className="h-5 w-5 text-green-600" />
//                 </div>
//                 <div>
//                   <h4 className="font-medium">Aadhar Verification</h4>
//                   <p className="text-sm text-gray-600">Your Aadhar details have been verified</p>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-lg border bg-white p-4 shadow-sm">
//               <div className="flex items-start space-x-3">
//                 <div className="rounded-full bg-green-100 p-1">
//                   <CheckCircle2 className="h-5 w-5 text-green-600" />
//                 </div>
//                 <div>
//                   <h4 className="font-medium">Bank Account Verification</h4>
//                   <p className="text-sm text-gray-600">Your bank account details have been verified</p>
//                 </div>
//               </div>
//             </div>
//           </motion.div>

//           <motion.div variants={itemVariants} className="mt-4">
//             <Button asChild size="lg" className="gap-2 px-8 text-base">
//               <Link href="/dashboard">
//                 Continue to Dashboard <ArrowRight className="h-4 w-4" />
//               </Link>
//             </Button>
//           </motion.div>
//         </>
//       )}

//       {someCompleted && (
//         <>
//           <motion.div className="rounded-full bg-amber-100 p-6" variants={checkVariants}>
//             <CheckCircle2 className="h-16 w-16 text-amber-600" />
//           </motion.div>

//           <motion.div className="text-center" variants={itemVariants}>
//             <h3 className="text-2xl font-bold text-amber-700">Almost There,   {user?.name}!</h3>
//             <p className="mt-2 text-lg text-gray-700">You've completed some verification steps.</p>
//             <p className="mt-1 text-gray-600">Complete the remaining steps to access all features.</p>
//           </motion.div>

//           <motion.div className="w-full max-w-md space-y-3" variants={itemVariants}>
//             {verificationStatus.pan.completed ? (
//               <div className="rounded-lg border bg-white p-4 shadow-sm">
//                 <div className="flex items-start space-x-3">
//                   <div className="rounded-full bg-green-100 p-1">
//                     <CheckCircle2 className="h-5 w-5 text-green-600" />
//                   </div>
//                   <div>
//                     <h4 className="font-medium">PAN Card Verification</h4>
//                     <p className="text-sm text-gray-600">Your PAN details have been verified</p>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="rounded-lg border bg-white p-4 shadow-sm opacity-60">
//                 <div className="flex items-start space-x-3">
//                   <div className="rounded-full bg-gray-200 p-1">
//                     <CheckCircle2 className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <div>
//                     <h4 className="font-medium">PAN Card Verification</h4>
//                     <p className="text-sm text-gray-600">
//                       {verificationStatus.pan.skipped ? "Skipped - Complete this step later" : "Pending verification"}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {verificationStatus.aadhar.completed ? (
//               <div className="rounded-lg border bg-white p-4 shadow-sm">
//                 <div className="flex items-start space-x-3">
//                   <div className="rounded-full bg-green-100 p-1">
//                     <CheckCircle2 className="h-5 w-5 text-green-600" />
//                   </div>
//                   <div>
//                     <h4 className="font-medium">Aadhar Verification</h4>
//                     <p className="text-sm text-gray-600">Your Aadhar details have been verified</p>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="rounded-lg border bg-white p-4 shadow-sm opacity-60">
//                 <div className="flex items-start space-x-3">
//                   <div className="rounded-full bg-gray-200 p-1">
//                     <CheckCircle2 className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <div>
//                     <h4 className="font-medium">Aadhar Verification</h4>
//                     <p className="text-sm text-gray-600">
//                       {verificationStatus.aadhar.skipped
//                         ? "Skipped - Complete this step later"
//                         : "Pending verification"}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {verificationStatus.bank.completed ? (
//               <div className="rounded-lg border bg-white p-4 shadow-sm">
//                 <div className="flex items-start space-x-3">
//                   <div className="rounded-full bg-green-100 p-1">
//                     <CheckCircle2 className="h-5 w-5 text-green-600" />
//                   </div>
//                   <div>
//                     <h4 className="font-medium">Bank Account Verification</h4>
//                     <p className="text-sm text-gray-600">Your bank account details have been verified</p>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div className="rounded-lg border bg-white p-4 shadow-sm opacity-60">
//                 <div className="flex items-start space-x-3">
//                   <div className="rounded-full bg-gray-200 p-1">
//                     <CheckCircle2 className="h-5 w-5 text-gray-400" />
//                   </div>
//                   <div>
//                     <h4 className="font-medium">Bank Account Verification</h4>
//                     <p className="text-sm text-gray-600">
//                       {verificationStatus.bank.skipped ? "Skipped - Complete this step later" : "Pending verification"}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </motion.div>

//           <motion.div variants={itemVariants} className="flex gap-4">
//             <Button variant="outline" asChild>
//               <Link href="/verification">Complete Verification</Link>
//             </Button>
//             <Button asChild>
//               <Link href="/dashboard">Continue to Dashboard</Link>
//             </Button>
//           </motion.div>
//         </>
//       )}

//       {allSkipped && (
//         <>
//           <motion.div className="rounded-full bg-amber-100 p-6" variants={checkVariants}>
//             <Award className="h-16 w-16 text-amber-600" />
//           </motion.div>

//           <motion.div className="text-center" variants={itemVariants}>
//             <h3 className="text-2xl font-bold text-amber-700">Welcome,   {user?.name}!</h3>
//             <p className="mt-2 text-lg text-gray-700">You've skipped all verification steps for now.</p>
//             <p className="mt-1 text-gray-600">You can complete verification later, but some features may be limited.</p>
//           </motion.div>

//           <motion.div variants={itemVariants} className="flex gap-4">
//             <Button variant="outline" asChild>
//               <Link href="/verification">Complete Verification</Link>
//             </Button>
//             <Button asChild>
//               <Link href="/dashboard">Continue to Dashboard</Link>
//             </Button>
//           </motion.div>
//         </>
//       )}
//     </motion.div>
//   )
// }



"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Award, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

interface VerificationCompleteProps {
  verificationStatus: {
    pan: { completed: boolean; skipped: boolean }
    aadhar: { completed: boolean; skipped: boolean }
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  accountType: string;
  isLoggedIn: boolean;
}

export default function VerificationComplete({ verificationStatus }: VerificationCompleteProps) {
  const [user, setUser] = useState<User | null>(null);

  // Check authentication
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
      }
    } else {
      console.log("user not found")
    }
  }, []);

  const allCompleted =
    verificationStatus.pan.completed && verificationStatus.aadhar.completed

  const someCompleted =
    (verificationStatus.pan.completed || verificationStatus.aadhar.completed) &&
    !allCompleted

  const allSkipped =
    verificationStatus.pan.skipped && verificationStatus.aadhar.skipped

  // Animation variants for the checkmark and content
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  const checkVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center space-y-6 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {allCompleted && (
        <>
          <motion.div
            className="relative flex h-32 w-32 items-center justify-center rounded-full bg-green-100"
            variants={checkVariants}
          >
            <CheckCircle2 className="h-20 w-20 text-green-600" />
            <div className="absolute -right-2 -top-2 rounded-full bg-primary p-2">
              <Award className="h-6 w-6 text-white" />
            </div>
          </motion.div>

          <motion.div className="text-center" variants={itemVariants}>
            <h3 className="text-2xl font-bold text-green-700">All Set, {user?.name}!</h3>
            <p className="mt-2 text-lg text-gray-700">You've successfully completed all verification steps.</p>
            <p className="mt-1 text-gray-600">
              Your account is now fully verified and you have access to all features.
            </p>
          </motion.div>

          <motion.div className="w-full max-w-md space-y-3" variants={itemVariants}>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-green-100 p-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">PAN Card Verification</h4>
                  <p className="text-sm text-gray-600">Your PAN details have been verified</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-green-100 p-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Aadhar Verification</h4>
                  <p className="text-sm text-gray-600">Your Aadhar details have been verified</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-4">
            <Button asChild size="lg" className="gap-2 px-8 text-base">
              <Link href="/dashboard">
                Continue to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </>
      )}

      {someCompleted && (
        <>
          <motion.div className="rounded-full bg-amber-100 p-6" variants={checkVariants}>
            <CheckCircle2 className="h-16 w-16 text-amber-600" />
          </motion.div>

          <motion.div className="text-center" variants={itemVariants}>
            <h3 className="text-2xl font-bold text-amber-700">Almost There, {user?.name}!</h3>
            <p className="mt-2 text-lg text-gray-700">You've completed some verification steps.</p>
            <p className="mt-1 text-gray-600">Complete the remaining steps to access all features.</p>
          </motion.div>

          <motion.div className="w-full max-w-md space-y-3" variants={itemVariants}>
            {verificationStatus.pan.completed ? (
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-green-100 p-1">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">PAN Card Verification</h4>
                    <p className="text-sm text-gray-600">Your PAN details have been verified</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-white p-4 shadow-sm opacity-60">
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-gray-200 p-1">
                    <CheckCircle2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">PAN Card Verification</h4>
                    <p className="text-sm text-gray-600">
                      {verificationStatus.pan.skipped ? "Skipped - Complete this step later" : "Pending verification"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {verificationStatus.aadhar.completed ? (
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-green-100 p-1">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Aadhar Verification</h4>
                    <p className="text-sm text-gray-600">Your Aadhar details have been verified</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-white p-4 shadow-sm opacity-60">
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-gray-200 p-1">
                    <CheckCircle2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Aadhar Verification</h4>
                    <p className="text-sm text-gray-600">
                      {verificationStatus.aadhar.skipped
                        ? "Skipped - Complete this step later"
                        : "Pending verification"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/verification">Complete Verification</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Continue to Dashboard</Link>
            </Button>
          </motion.div>
        </>
      )}

      {allSkipped && (
        <>
          <motion.div className="rounded-full bg-amber-100 p-6" variants={checkVariants}>
            <Award className="h-16 w-16 text-amber-600" />
          </motion.div>

          <motion.div className="text-center" variants={itemVariants}>
            <h3 className="text-2xl font-bold text-amber-700">Welcome, {user?.name}!</h3>
            <p className="mt-2 text-lg text-gray-700">You've skipped all verification steps for now.</p>
            <p className="mt-1 text-gray-600">You can complete verification later, but some features may be limited.</p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/verification">Complete Verification</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Continue to Dashboard</Link>
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}