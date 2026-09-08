type WalletTxLike = {
  id?: string | number;
  type?: string;
  reference?: string;
  created_at?: string;
};

/** Human-readable wallet transaction titles (referral, welcome bonus, etc.). */
export function formatWalletTransactionTitle(tx: Pick<WalletTxLike, "type" | "reference">): string {
  const ref = String(tx.reference ?? "").toLowerCase();
  const type = String(tx.type ?? "").toLowerCase();

  if (
    ref.includes("referral") ||
    ref.includes("referrer") ||
    ref.includes("referee") ||
    type.includes("referral")
  ) {
    if (
      ref.includes("referee") ||
      ref.includes("invited") ||
      ref.includes("welcome_referral") ||
      ref.includes("referral_welcome")
    ) {
      return "Referral welcome bonus";
    }
    if (ref.includes("referrer") || ref.includes("refer_friend")) {
      return "Referral bonus — friend joined";
    }
    return "Referral bonus";
  }

  if (ref.includes("welcome") || ref.includes("signup_bonus") || ref.includes("sign_up")) {
    return "Welcome bonus";
  }

  if (type.includes("withdraw") || ref.includes("withdraw")) {
    return "Withdrawal";
  }

  if (type.includes("credit") || type.includes("deposit")) {
    return "Wallet credit";
  }

  if (type.includes("debit")) {
    return "Wallet debit";
  }

  const raw = (tx.type || "").trim();
  if (!raw) return "Transaction";
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, " ");
}

export function formatWalletTransactionSubtitle(tx: Pick<WalletTxLike, "reference" | "id" | "created_at">): string {
  const ref = String(tx.reference ?? "").trim();
  const idPart = ref || String(tx.id ?? "");
  const date = tx.created_at
    ? new Date(tx.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  return `${idPart} • ${date}`;
}
