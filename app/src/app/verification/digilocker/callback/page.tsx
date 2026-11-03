"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import axiosInstance from "../../../../lib/axiosInstance";
import { verificationFailureMessage } from "@/lib/slowApiErrors";
import {
  clearDigilockerSession,
  readCallbackUserId,
  readCallbackVerificationId,
} from "@/lib/digilockerSession";

function DigilockerCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing verification…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const run = async () => {
      let verificationId = readCallbackVerificationId(searchParams);
      let userId = readCallbackUserId(searchParams);

      if (verificationId && !userId) {
        try {
          const lookup = await axiosInstance.get(
            `/digilocker/kyc/session/?verification_id=${encodeURIComponent(verificationId)}`
          );
          const payload = lookup.data?.data ?? lookup.data;
          userId = payload?.user_id ? String(payload.user_id) : "";
        } catch {
          /* fall through to error below */
        }
      }

      if (!verificationId || !userId) {
        setFailed(true);
        setMessage(
          "We could not match this DigiLocker return to your account. Open JobPool from the app or browser where you started verification, log in, and tap Continue with DigiLocker again."
        );
        return;
      }

      const qUser = encodeURIComponent(userId);
      const qVid = encodeURIComponent(verificationId);

      try {
        const statusRes = await axiosInstance.get(
          `/digilocker/kyc/status/?verification_id=${qVid}&user_id=${qUser}`
        );
        const statusPayload = statusRes.data?.data ?? statusRes.data;
        const status = statusPayload?.status;
        if (status && status !== "AUTHENTICATED") {
          setFailed(true);
          setMessage(
            statusRes.data?.message ||
              `DigiLocker status: ${status}. If you denied consent, start again from verification.`
          );
          return;
        }

        const completeRes = await axiosInstance.post(
          `/digilocker/kyc/complete/?verification_id=${qVid}&user_id=${qUser}`,
          null,
          { timeout: 60000 }
        );
        if (completeRes.data?.status_code === 200) {
          clearDigilockerSession();
          const result = completeRes.data?.data ?? {};
          const stillNeeded = result.documents_still_needed as string[] | undefined;
          if (stillNeeded?.length) {
            router.replace("/verification?digilocker=partial");
          } else {
            router.replace("/verification?digilocker=success");
          }
          return;
        }
        setFailed(true);
        setMessage(
          completeRes.data?.message || "Verification could not be completed."
        );
      } catch (err: unknown) {
        setFailed(true);
        setMessage(
          verificationFailureMessage(
            err,
            "Verification could not be completed. Go back and try DigiLocker again."
          )
        );
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
