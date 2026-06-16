import {
  pickLatestWithdrawal,
  type AdminWithdrawal,
} from "@/lib/walletWithdrawalsApi";

export type VerificationFilter =
  | "all"
  | "unverified"
  | "pan_only"
  | "aadhaar_pending"
  | "identity_complete"
  | "bank_complete";

export type SignupBonusFilter =
  | "all"
  | "incomplete"
  | "ready"
  | "bonus_in_wallet"
  | "payout_pending"
  | "credited"
  | "unknown";

export type SignupBonusCategory =
  | "missing"
  | "ready"
  | "bonus_in_wallet"
  | "payout_pending"
  | "credited"
  | "unknown";

export type CustomerFilterRow = {
  user_id: string;
  user_fullname: string;
  user_email: string;
  phone_number?: string;
  verification_status: number;
  signup_bonus_missing?: string[];
  signup_bonus_eligible?: boolean;
  signup_bonus_claimed?: boolean;
  signup_bonus_awaiting_admin_payout?: boolean;
  signup_bonus_amount?: number;
  tasker?: boolean;
  task_manager?: boolean;
  created_at?: string;
  joined_at?: string;
  date_joined?: string;
};

export const VERIFICATION_FILTER_LABELS: Record<VerificationFilter, string> = {
  all: "All verification",
  unverified: "Unverified (none)",
  pan_only: "PAN only",
  aadhaar_pending: "Aadhaar not done",
  identity_complete: "PAN + Aadhaar done",
  bank_complete: "Bank complete",
};

export const SIGNUP_BONUS_FILTER_LABELS: Record<SignupBonusFilter, string> = {
  all: "All signup bonus",
  incomplete: "Incomplete / missing steps",
  ready: "Ready · can withdraw",
  bonus_in_wallet: "Bonus in wallet",
  payout_pending: "Payout pending",
  credited: "Credited (paid)",
  unknown: "No bonus data",
};

export function hasSignupBonusApi(c: CustomerFilterRow): boolean {
  return (
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_claimed") ||
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_eligible") ||
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_missing") ||
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_amount") ||
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_awaiting_admin_payout")
  );
}

export function getSignupBonusCategory(
  customer: CustomerFilterRow,
  withdrawalsForUser: AdminWithdrawal[] = []
): SignupBonusCategory {
  if (!hasSignupBonusApi(customer)) return "unknown";

  const missing = Array.isArray(customer.signup_bonus_missing)
    ? customer.signup_bonus_missing
    : [];

  if (customer.signup_bonus_claimed === true) return "credited";
  if (missing.length > 0) return "missing";
  if (customer.signup_bonus_eligible === true) return "ready";

  const awaitingPayout =
    customer.signup_bonus_awaiting_admin_payout === true ||
    (customer.signup_bonus_eligible === false &&
      customer.signup_bonus_claimed !== true &&
      missing.length === 0);

  if (awaitingPayout) {
    const latest = pickLatestWithdrawal(withdrawalsForUser);
    return latest ? "payout_pending" : "bonus_in_wallet";
  }

  return "unknown";
}

export function getSignupBonusLabel(category: SignupBonusCategory): string {
  switch (category) {
    case "missing":
      return "Incomplete";
    case "ready":
      return "Ready";
    case "bonus_in_wallet":
      return "Bonus in wallet";
    case "payout_pending":
      return "Payout pending";
    case "credited":
      return "Credited";
    default:
      return "—";
  }
}

export function matchesVerificationFilter(
  status: number,
  filter: VerificationFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "unverified") return status === 0;
  if (filter === "pan_only") return status === 1;
  if (filter === "aadhaar_pending") return status < 2;
  if (filter === "identity_complete") return status >= 2;
  if (filter === "bank_complete") return status >= 3;
  return true;
}

export function matchesSignupBonusFilter(
  customer: CustomerFilterRow,
  filter: SignupBonusFilter,
  withdrawalsForUser: AdminWithdrawal[] = []
): boolean {
  if (filter === "all") return true;
  const category = getSignupBonusCategory(customer, withdrawalsForUser);
  if (filter === "incomplete") return category === "missing";
  if (filter === "ready") return category === "ready";
  if (filter === "bonus_in_wallet") return category === "bonus_in_wallet";
  if (filter === "payout_pending") return category === "payout_pending";
  if (filter === "credited") return category === "credited";
  if (filter === "unknown") return category === "unknown";
  return true;
}

export function filterCustomers(
  customers: CustomerFilterRow[],
  options: {
    searchTerm: string;
    verificationFilter: VerificationFilter;
    signupBonusFilter: SignupBonusFilter;
    withdrawalsByUserId: Map<string, AdminWithdrawal[]>;
  }
): CustomerFilterRow[] {
  const q = options.searchTerm.trim().toLowerCase();
  const filtered = customers.filter((customer) => {
    const matchesSearch =
      !q ||
      customer.user_fullname.toLowerCase().includes(q) ||
      customer.user_email.toLowerCase().includes(q) ||
      (customer.phone_number && customer.phone_number.includes(q));

    if (!matchesSearch) return false;
    if (!matchesVerificationFilter(customer.verification_status, options.verificationFilter)) {
      return false;
    }
    const userWithdrawals = options.withdrawalsByUserId.get(customer.user_id) ?? [];
    if (
      !matchesSignupBonusFilter(customer, options.signupBonusFilter, userWithdrawals)
    ) {
      return false;
    }
    return true;
  });

  const joinedAt = (c: CustomerFilterRow) =>
    c.created_at ?? c.joined_at ?? c.date_joined ?? "";

  return [...filtered].sort((a, b) => {
    const ta = joinedAt(a) ? new Date(joinedAt(a)).getTime() : 0;
    const tb = joinedAt(b) ? new Date(joinedAt(b)).getTime() : 0;
    return tb - ta;
  });
}

export function countByVerificationFilter(
  customers: CustomerFilterRow[],
  filter: VerificationFilter
): number {
  if (filter === "all") return customers.length;
  return customers.filter((c) =>
    matchesVerificationFilter(c.verification_status, filter)
  ).length;
}

export function countBySignupBonusFilter(
  customers: CustomerFilterRow[],
  filter: SignupBonusFilter,
  withdrawalsByUserId: Map<string, AdminWithdrawal[]>
): number {
  if (filter === "all") return customers.length;
  return customers.filter((c) =>
    matchesSignupBonusFilter(
      c,
      filter,
      withdrawalsByUserId.get(c.user_id) ?? []
    )
  ).length;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function downloadCustomersCsv(
  rows: CustomerFilterRow[],
  withdrawalsByUserId: Map<string, AdminWithdrawal[]>,
  filenameSuffix: string
) {
  const headers = [
    "Name",
    "Email",
    "Mobile",
    "Joined",
    "Verification status",
    "PAN",
    "Aadhaar",
    "Bank",
    "Signup bonus",
    "Missing steps",
    "Roles",
  ];

  const lines = rows.map((c) => {
    const v = Number(c.verification_status) || 0;
    const category = getSignupBonusCategory(c, withdrawalsByUserId.get(c.user_id) ?? []);
    const missing = Array.isArray(c.signup_bonus_missing)
      ? c.signup_bonus_missing.join("; ")
      : "";
    const joined = c.created_at ?? c.joined_at ?? c.date_joined ?? "";
    const roles = [c.tasker ? "Tasker" : "", c.task_manager ? "Task Manager" : ""]
      .filter(Boolean)
      .join(", ");

    return [
      csvEscape(c.user_fullname),
      csvEscape(c.user_email),
      csvEscape(c.phone_number ?? ""),
      csvEscape(joined),
      csvEscape(v),
      csvEscape(v >= 1 ? "Yes" : "No"),
      csvEscape(v >= 2 ? "Yes" : "No"),
      csvEscape(v >= 3 ? "Yes" : "No"),
      csvEscape(getSignupBonusLabel(category)),
      csvEscape(missing),
      csvEscape(roles || "Customer"),
    ].join(",");
  });

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `customers_${filenameSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
