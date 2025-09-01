// "use client"

// import { useState } from "react"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "../../components/ui/card"
// import { Button } from "../../components/ui/button"
// import BankVerification from "../../components/verification/bank-verification"
// import { useRouter } from "next/navigation"

// export default function BankVerificationPage() {
//   const router = useRouter()
//   const [verificationStatus, setVerificationStatus] = useState({
//     bank: { completed: false, skipped: false },
//   })

//   const handleComplete = () => {
//     setVerificationStatus((prev) => ({
//       ...prev,
//       bank: { completed: true, skipped: false },
//     }))
//     router.push('/verification-complete')
//   }

//   const handleSkip = () => {
//     setVerificationStatus((prev) => ({
//       ...prev,
//       bank: { completed: false, skipped: true },
//     }))
//     router.push('/verification-complete')
//   }

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
//       <Card className="w-full max-w-4xl">
//         <CardHeader>
//           <CardTitle className="text-2xl font-bold">Bank Verification</CardTitle>
//           <CardDescription>
//             Please complete the bank verification process
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <BankVerification onComplete={handleComplete} />
//         </CardContent>
//         <CardFooter className="flex justify-between">
//           <div className="flex gap-2">
//             <Button variant="ghost" onClick={handleSkip}>
//               Skip for now
//             </Button>
//           </div>
//         </CardFooter>
//       </Card>
//     </div>
//   )
// }

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import BankVerification from "../../components/verification/bank-verification";
import { useRouter } from "next/navigation";

export default function BankVerificationPage() {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState({
    bank: { completed: false, skipped: false },
  });

  const handleComplete = () => {
    setVerificationStatus((prev) => ({
      ...prev,
      bank: { completed: true, skipped: false },
    }));
    router.push('/dashboard');
  };

  const handleSkip = () => {
    setVerificationStatus((prev) => ({
      ...prev,
      bank: { completed: false, skipped: true },
    }));
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Bank Verification</CardTitle>
          <CardDescription>
            Please complete the bank verification process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BankVerification onComplete={handleComplete} />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}