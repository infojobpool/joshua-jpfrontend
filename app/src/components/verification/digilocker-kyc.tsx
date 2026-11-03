"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import axiosInstance from "../../lib/axiosInstance";
import useStore from "../../lib/Zustand";
import { verificationApiFailureMessage } from "@/lib/slowApiErrors";
import { DigilockerWalkthrough } from "./digilocker-walkthrough";
import { persistDigilockerSession } from "@/lib/digilockerSession";

interface DigilockerKycProps {
  onComplete: () => void;
  panVerified?: boolean;
  aadhaarVerified?: boolean;
}

type DigilockerUserFlow = "signin" | "signup";

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

export default function DigilockerKyc({
  onComplete,
  panVerified = false,
  aadhaarVerified = false,
}: DigilockerKycProps) {
  const { userId } = useStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<DigilockerUserFlow | null>(null);

  const startDigilocker = useCallback(
    async (userFlow: DigilockerUserFlow) => {
      setError("");
      const effectiveUserId = resolveUserId(userId);
      if (!effectiveUserId) {
        setError("User ID not found. Please log in and try again.");
        return;
      }
      try {
        setLoading(userFlow);
        const response = await axiosInstance.post(
          `/digilocker/kyc/start/?user_id=${encodeURIComponent(effectiveUserId)}`,
          { user_flow: userFlow },
          { timeout: 60000 }
        );
        const data = response.data;
        if (data.status_code === 200 && data.data?.url) {
          const vid = data.data.verification_id
            ? String(data.data.verification_id)
            : undefined;
          persistDigilockerSession(effectiveUserId, vid);
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
        setLoading(null);
      }
    },
    [userId, onComplete]
  );

  const busy = loading !== null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Verify PAN &amp; Aadhaar</h3>
        <p className="text-sm text-gray-500">
          DigiLocker (government). We only ask for documents you still need —
          you can verify Aadhaar first and add PAN later when it&apos;s in your
          wallet.
        </p>
      </div>

      {(panVerified || aadhaarVerified) && (
        <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {aadhaarVerified && <p>Aadhaar: verified</p>}
          {panVerified && <p>PAN: verified</p>}
          {!panVerified && aadhaarVerified && (
            <p className="text-green-900">
              Next: add PAN in DigiLocker, then tap Continue again to share PAN.
            </p>
          )}
          {!aadhaarVerified && panVerified && (
            <p className="text-green-900">
              Next: complete Aadhaar sharing on the next DigiLocker visit.
            </p>
          )}
        </div>
      )}

      <DigilockerWalkthrough />

      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Keep your Aadhaar-linked mobile nearby for OTP.</li>
        <li>Approve every document JobPool requests on the consent screen.</li>
        <li>Finish within 10 minutes after opening the link.</li>
      </ul>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        className="w-full"
        onClick={() => void startDigilocker("signin")}
        disabled={busy}
      >
        {loading === "signin" ? "Starting…" : "Continue with DigiLocker"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => void startDigilocker("signup")}
        disabled={busy}
      >
        {loading === "signup"
          ? "Starting…"
          : "New user? Start with Sign up"}
      </Button>
      <p className="text-center text-xs text-gray-500">
        Both buttons open DigiLocker. Use Sign up if you have never created an
        account.
      </p>
    </div>
  );
}
