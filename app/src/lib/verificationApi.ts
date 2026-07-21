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

/** One retry after cold-start / Cashfree slowness. */
export async function postVerificationWithRetry(
  url: string,
  body?: Record<string, unknown>
): Promise<AxiosResponse> {
  try {
    return body
      ? await axiosInstance.post(url, body, VERIFY_OPTS)
      : await axiosInstance.post(url, undefined, VERIFY_OPTS);
  } catch (err) {
    if (!isSlowServerError(err)) throw err;
    await sleep(2500);
    return body
      ? await axiosInstance.post(url, body, VERIFY_OPTS)
      : await axiosInstance.post(url, undefined, VERIFY_OPTS);
  }
}
