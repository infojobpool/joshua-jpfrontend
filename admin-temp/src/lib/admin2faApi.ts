import axiosInstance from "@/lib/axiosInstance";
import { getApiErrorMessage } from "@/lib/apiError";

export type Admin2faStatus = {
  totp_enabled: boolean;
  backup_codes_remaining: number;
};

export type Admin2faSetup = {
  secret: string;
  otpauth_url: string;
  account: string;
};

function unwrapPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return root;
}

function parseStatus(payload: unknown): Admin2faStatus {
  const row = unwrapPayload(payload);
  return {
    totp_enabled: Boolean(row.totp_enabled ?? row.enabled ?? row.is_enabled),
    backup_codes_remaining: Number(
      row.backup_codes_remaining ?? row.backup_codes_left ?? row.remaining_backup_codes ?? 0
    ),
  };
}

function parseSetup(payload: unknown): Admin2faSetup {
  const row = unwrapPayload(payload);
  return {
    secret: String(row.secret ?? "").trim(),
    otpauth_url: String(row.otpauth_url ?? row.uri ?? "").trim(),
    account: String(row.account ?? row.label ?? "").trim(),
  };
}

function parseBackupCodes(payload: unknown): string[] {
  const row = unwrapPayload(payload);
  const raw = row.backup_codes ?? row.codes;
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => String(c).trim()).filter(Boolean);
}

export async function fetchAdmin2faStatus(): Promise<Admin2faStatus> {
  const res = await axiosInstance.get("admin/2fa/status/");
  return parseStatus(res.data);
}

export async function startAdmin2faSetup(): Promise<Admin2faSetup> {
  const res = await axiosInstance.post("admin/2fa/setup/", {});
  return parseSetup(res.data);
}

export async function enableAdmin2fa(code: string): Promise<string[]> {
  const res = await axiosInstance.post("admin/2fa/enable/", {
    code: code.trim(),
  });
  return parseBackupCodes(res.data);
}

export async function disableAdmin2fa(password: string, code: string): Promise<void> {
  await axiosInstance.post("admin/2fa/disable/", {
    password,
    code: code.trim(),
  });
}

/** Superadmin only — clears another admin’s 2FA. */
export async function resetAdmin2faForUser(userId: string): Promise<void> {
  await axiosInstance.post("admin/2fa/reset/", {
    user_id: userId,
  });
}

export function getAdmin2faError(err: unknown): string {
  return getApiErrorMessage(err);
}
