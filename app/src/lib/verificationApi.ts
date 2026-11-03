import type { AxiosResponse } from "axios";
import axiosInstance from "./axiosInstance";
import {
  isSlowServerError,
  VERIFICATION_REQUEST_TIMEOUT_MS,
} from "./slowApiErrors";

const VERIFY_OPTS = { timeout: VERIFICATION_REQUEST_TIMEOUT_MS } as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryVerificationPost(url: string): boolean {
  const u = url.toLowerCase();
  // OTP send/verify must not run twice — Cashfree sessions are single-use / short-lived.
  if (u.includes("verify-aadhaar")) return false;
  return true;
}

async function postVerificationOnce(
  url: string,
  body?: Record<string, unknown>
): Promise<AxiosResponse> {
  return body
    ? await axiosInstance.post(url, body, VERIFY_OPTS)
    : await axiosInstance.post(url, undefined, VERIFY_OPTS);
}

/** One retry after cold-start / Cashfree slowness (never for Aadhaar OTP). */
export async function postVerificationWithRetry(
  url: string,
  body?: Record<string, unknown>
): Promise<AxiosResponse> {
  if (!shouldRetryVerificationPost(url)) {
    return postVerificationOnce(url, body);
  }
  try {
    return await postVerificationOnce(url, body);
  } catch (err) {
    if (!isSlowServerError(err)) throw err;
    await sleep(2500);
    return postVerificationOnce(url, body);
  }
}
