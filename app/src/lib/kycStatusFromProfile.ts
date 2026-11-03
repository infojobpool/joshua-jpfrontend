export type KycCompletion = {
  pan: boolean;
  aadhaar: boolean;
};

export function kycFromProfilePayload(
  payload: Record<string, unknown> | null | undefined,
  verificationStatus: number | null
): KycCompletion {
  const p = payload ?? {};
  const panFlag = p.pan_verified;
  const aadhaarFlag = p.aadhaar_verified;
  const pan =
    typeof panFlag === "boolean"
      ? panFlag
      : verificationStatus !== null && verificationStatus >= 1;
  const aadhaar =
    typeof aadhaarFlag === "boolean"
      ? aadhaarFlag
      : verificationStatus !== null && verificationStatus >= 2;
  return { pan, aadhaar };
}

export function kycFullyComplete(kyc: KycCompletion): boolean {
  return kyc.pan && kyc.aadhaar;
}
