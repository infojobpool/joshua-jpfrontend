const USER_KEY = "digilocker_user_id";
const VID_KEY = "digilocker_verification_id";

function writeStore(store: Storage, userId: string, verificationId?: string) {
  store.setItem(USER_KEY, userId);
  if (verificationId) {
    store.setItem(VID_KEY, verificationId);
  }
}

/** Survives mobile in-app browsers that drop sessionStorage after external redirect. */
export function persistDigilockerSession(
  userId: string,
  verificationId?: string
): void {
  if (typeof window === "undefined") return;
  try {
    writeStore(localStorage, userId, verificationId);
  } catch {
    /* ignore */
  }
  try {
    writeStore(sessionStorage, userId, verificationId);
  } catch {
    /* ignore */
  }
}

export function clearDigilockerSession(): void {
  if (typeof window === "undefined") return;
  for (const store of [localStorage, sessionStorage]) {
    try {
      store.removeItem(USER_KEY);
      store.removeItem(VID_KEY);
    } catch {
      /* ignore */
    }
  }
}

function readKey(key: string): string {
  if (typeof window === "undefined") return "";
  for (const store of [localStorage, sessionStorage]) {
    try {
      const val = store.getItem(key);
      if (val) return val;
    } catch {
      /* ignore */
    }
  }
  return "";
}

export function readStoredDigilockerUserId(): string {
  return readKey(USER_KEY);
}

export function readStoredDigilockerVerificationId(): string {
  return readKey(VID_KEY);
}

/** Cashfree redirect query params (and hash fallback). */
export function readCallbackVerificationId(
  searchParams: URLSearchParams
): string {
  const fromParams =
    searchParams.get("verification_id") ||
    searchParams.get("verificationId") ||
    searchParams.get("verification-id") ||
    "";
  if (fromParams) return fromParams;

  if (typeof window === "undefined") return "";
  try {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return "";
    const hashParams = new URLSearchParams(hash);
    return (
      hashParams.get("verification_id") ||
      hashParams.get("verificationId") ||
      ""
    );
  } catch {
    return "";
  }
}

export function readCallbackUserId(searchParams: URLSearchParams): string {
  return (
    searchParams.get("user_id") ||
    searchParams.get("userId") ||
    readStoredDigilockerUserId()
  );
}
