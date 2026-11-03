"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import axiosInstance from "../../../../lib/axiosInstance";
import { verificationApiFailureMessage } from "@/lib/slowApiErrors";

function DigilockerCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing verification…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const userId =
        searchParams.get("user_id") ||
        sessionStorage.getItem("digilocker_user_id") ||
        "";
      const verificationId =
        searchParams.get("verification_id") ||
        sessionStorage.getItem("digilocker_verification_id") ||
        "";

      if (!userId || !verificationId) {
        setFailed(true);
        setMessage(
          "Missing verification session. Please go back and start DigiLocker again."
        );
        return;
      }

      try {
        const statusRes = await axiosInstance.get(
          `/digilocker/kyc/status/?user_id=${encodeURIComponent(userId)}&verification_id=${encodeURIComponent(verificationId)}`
        );
        const status = statusRes.data?.data?.status;
        if (status && status !== "AUTHENTICATED") {
          setFailed(true);
          setMessage(
            statusRes.data?.message ||
              `DigiLocker status: ${status}. If you denied consent, start again from verification.`
          );
          return;
        }

        const completeRes = await axiosInstance.post(
          `/digilocker/kyc/complete/?user_id=${encodeURIComponent(userId)}&verification_id=${encodeURIComponent(verificationId)}`,
          null,
          { timeout: 60000 }
        );
        if (completeRes.data?.status_code === 200) {
          sessionStorage.removeItem("digilocker_verification_id");
          sessionStorage.removeItem("digilocker_user_id");
          router.replace("/verification?digilocker=success");
          return;
        }
        setFailed(true);
        setMessage(
          completeRes.data?.message || "Verification could not be completed."
        );
      } catch (err: unknown) {
        setFailed(true);
        setMessage(verificationApiFailureMessage(err));
      }
    };
    void run();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <p className="text-center text-sm text-gray-700">{message}</p>
      {failed && (
        <Button variant="outline" onClick={() => router.push("/verification")}>
          Back to verification
        </Button>
      )}
    </div>
  );
}

export default function DigilockerCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6">
          Loading…
        </div>
      }
    >
      <DigilockerCallbackInner />
    </Suspense>
  );
}
