"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "../../lib/axiosInstance";
import useStore from "../../lib/Zustand";
import { verificationFailureMessage } from "@/lib/slowApiErrors";

interface OcrKycVerificationProps {
  panVerified: boolean;
  aadhaarVerified: boolean;
  onUpdated: () => void;
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

export default function OcrKycVerification({
  panVerified,
  aadhaarVerified,
  onUpdated,
}: OcrKycVerificationProps) {
  const { userId } = useStore();
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loadingPan, setLoadingPan] = useState(false);
  const [loadingAadhaar, setLoadingAadhaar] = useState(false);

  const submitPan = useCallback(async () => {
    setError("");
    const uid = resolveUserId(userId);
    if (!uid) {
      setError("Please log in and try again.");
      return;
    }
    if (!panFile) {
      setError("Choose a PAN card photo first.");
      return;
    }
    setLoadingPan(true);
    try {
      const form = new FormData();
      form.append("file", panFile);
      const res = await axiosInstance.post(
        `/ocr/kyc/pan/?user_id=${encodeURIComponent(uid)}`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        }
      );
      if (res.data?.status_code === 200) {
        setPanFile(null);
        onUpdated();
      } else {
        setError(res.data?.message || "PAN upload failed.");
      }
    } catch (err: unknown) {
      setError(
        verificationFailureMessage(err, "PAN verification failed. Try again.")
      );
    } finally {
      setLoadingPan(false);
    }
  }, [userId, panFile, onUpdated]);

  const submitAadhaar = useCallback(async () => {
    setError("");
    const uid = resolveUserId(userId);
    if (!uid) {
      setError("Please log in and try again.");
      return;
    }
    if (!aadhaarFront || !aadhaarBack) {
      setError("Upload both Aadhaar front and back photos.");
      return;
    }
    setLoadingAadhaar(true);
    try {
      const form = new FormData();
      form.append("front", aadhaarFront);
      form.append("back", aadhaarBack);
      const res = await axiosInstance.post(
        `/ocr/kyc/aadhaar/?user_id=${encodeURIComponent(uid)}`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 180000,
        }
      );
      if (res.data?.status_code === 200) {
        setAadhaarFront(null);
        setAadhaarBack(null);
        onUpdated();
      } else {
        setError(res.data?.message || "Aadhaar upload failed.");
      }
    } catch (err: unknown) {
      setError(
        verificationFailureMessage(
          err,
          "Aadhaar verification failed. Try again."
        )
      );
    } finally {
      setLoadingAadhaar(false);
    }
  }, [userId, aadhaarFront, aadhaarBack, onUpdated]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Verify with document photos</h3>
        <p className="text-sm text-gray-500">
          Upload clear photos of your PAN and Aadhaar (JPEG or PNG, max 5 MB).
          Use the camera on the physical card — not screenshots or photos of a
          screen. You can complete one document at a time.
        </p>
      </div>

      {!panVerified && (
        <div className="space-y-3 rounded-lg border p-4">
          <Label htmlFor="pan-file">PAN card</Label>
          <Input
            id="pan-file"
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={(e) => setPanFile(e.target.files?.[0] ?? null)}
          />
          <Button
            className="w-full"
            disabled={loadingPan || !panFile}
            onClick={() => void submitPan()}
          >
            {loadingPan ? "Verifying PAN…" : "Upload & verify PAN"}
          </Button>
        </div>
      )}

      {panVerified && (
        <p className="text-sm text-green-700 font-medium">PAN verified</p>
      )}

      {!aadhaarVerified && (
        <div className="space-y-3 rounded-lg border p-4">
          <Label htmlFor="aadhaar-front">Aadhaar — front</Label>
          <Input
            id="aadhaar-front"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => setAadhaarFront(e.target.files?.[0] ?? null)}
          />
          <Label htmlFor="aadhaar-back">Aadhaar — back</Label>
          <Input
            id="aadhaar-back"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => setAadhaarBack(e.target.files?.[0] ?? null)}
          />
          <Button
            className="w-full"
            disabled={loadingAadhaar || !aadhaarFront || !aadhaarBack}
            onClick={() => void submitAadhaar()}
          >
            {loadingAadhaar ? "Verifying Aadhaar…" : "Upload & verify Aadhaar"}
          </Button>
        </div>
      )}

      {aadhaarVerified && (
        <p className="text-sm text-green-700 font-medium">Aadhaar verified</p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
