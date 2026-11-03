"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import axiosInstance from "../../lib/axiosInstance";
import useStore from "../../lib/Zustand";
import { verificationApiFailureMessage } from "@/lib/slowApiErrors";

interface DigilockerKycProps {
  onComplete: () => void;
}

function resolveUserId(storeUserId: string | undefined): string {
  if (storeUserId) return storeUserId;
  try {
    const local = localStorage.getItem("user");
    if (local) {
      const parsed = JSON.parse(local);
      return (
        parsed?.id || parsed?.userId || parsed?.user_id || ""
      ).toString();
    }
  } catch {
    /* ignore */
  }
  return "";
}

export default function DigilockerKyc({ onComplete }: DigilockerKycProps) {
  const { userId } = useStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startDigilocker = useCallback(async () => {
    setError("");
    const effectiveUserId = resolveUserId(userId);
    if (!effectiveUserId) {
      setError("User ID not found. Please log in and try again.");
      return;
    }
    try {
      setLoading(true);
      sessionStorage.setItem("digilocker_user_id", effectiveUserId);
      const response = await axiosInstance.post(
        `/digilocker/kyc/start/?user_id=${encodeURIComponent(effectiveUserId)}`,
        { user_flow: "signin" },
        { timeout: 60000 }
      );
      const data = response.data;
      if (data.status_code === 200 && data.data?.url) {
        if (data.data.verification_id) {
          sessionStorage.setItem(
            "digilocker_verification_id",
            String(data.data.verification_id)
          );
        }
        window.location.href = data.data.url as string;
        return;
      }
      if (data.data?.already_verified) {
        onComplete();
        return;
      }
      setError(data.message || "Could not start DigiLocker verification.");
    } catch (err: unknown) {
      setError(verificationApiFailureMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId, onComplete]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Verify PAN &amp; Aadhaar</h3>
        <p className="text-sm text-gray-500">
          You&apos;ll be redirected to DigiLocker to securely share PAN and
          Aadhaar with JobPool. SMS OTP on this page is no longer supported.
        </p>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Use the mobile number linked to your DigiLocker account.</li>
        <li>Approve sharing of both PAN and Aadhaar.</li>
        <li>Open the link within 10 minutes.</li>
      </ul>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button className="w-full" onClick={startDigilocker} disabled={loading}>
        {loading ? "Starting…" : "Continue with DigiLocker"}
      </Button>
    </div>
  );
}
