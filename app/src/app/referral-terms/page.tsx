import type { Metadata } from "next";
import Link from "next/link";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import {
  REFERRAL_MILESTONE_REWARD_INR,
  REFERRAL_MILESTONE_VERIFIED_COUNT,
  REFERRAL_QUALIFYING_COPY,
  WELCOME_BONUS_INR,
} from "@/lib/referral/constants";

export const metadata: Metadata = buildPublicMetadata({
  title: "Referral Program Terms | JobPool",
  description:
    "Rules for JobPool invite-and-earn referral wallet credits for referrers and invited friends.",
  path: "/referral-terms",
});

export default function ReferralTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/referrals" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          ← Back to Invite &amp; earn
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">Referral program terms</h1>
        <p className="mt-2 text-slate-600 text-sm">Last updated: October 2026</p>

        <div className="mt-8 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
            <p className="mt-2">
              JobPool’s referral program rewards users who invite new members (<strong>referrers</strong>) with
              wallet credit when qualifying conditions are met. New users (<strong>referees</strong>) may receive
              the standard welcome bonus. Rewards are promotional wallet credits, not cash unless withdrawn under
              normal wallet rules. Anyone who joined via a referral may also share their own link under the same
              rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Reward amounts</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                <strong>Welcome bonus (all new users):</strong> up to{" "}
                <strong>₹{WELCOME_BONUS_INR}</strong> wallet credit after completing the full profile &amp;
                payout verification checklist.
              </li>
              <li>
                <strong>Referrer milestone:</strong> <strong>₹{REFERRAL_MILESTONE_REWARD_INR}</strong> each time{" "}
                <strong>{REFERRAL_MILESTONE_VERIFIED_COUNT}</strong> distinct people sign up with your link and
                complete that same full verification checklist (repeats for every additional{" "}
                {REFERRAL_MILESTONE_VERIFIED_COUNT} verified invites).
              </li>
              <li>
                There is no separate per-signup referral bonus for invited friends beyond the welcome bonus.
              </li>
            </ul>
            <p className="mt-2 text-sm text-slate-600">
              Amounts may change. The amounts and rules shown in the app at the time of invite or signup apply.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">How a referral qualifies</h2>
            <p className="mt-2">{REFERRAL_QUALIFYING_COPY}</p>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
              <li>The referee must be a new JobPool user who has not previously registered.</li>
              <li>The referee must sign up using the referrer’s valid link or code at registration.</li>
              <li>
                Only one referrer per new account — the first valid code or link used at registration counts.
              </li>
              <li>
                Sign-up alone does not pay the referrer. Only referees who complete{" "}
                <strong>all</strong> payout verification steps count toward the{" "}
                {REFERRAL_MILESTONE_VERIFIED_COUNT}-person milestone.
              </li>
              <li>
                Partial verification progress is visible in the app but does not count until the checklist is
                complete.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">When credits are paid</h2>
            <p className="mt-2">
              Welcome bonus and referral milestone credits are issued after JobPool confirms full verification
              (and, for milestones, that the verified count reached a multiple of{" "}
              {REFERRAL_MILESTONE_VERIFIED_COUNT}). This may take up to 48 hours. Credits appear in your wallet
              transaction history.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Fair use &amp; limits</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
              <li>Self-referrals, duplicate accounts, or fraudulent verification are not eligible.</li>
              <li>JobPool may cap referrals per user per month or per device.</li>
              <li>We may withhold or reverse credits if fraud or abuse is suspected.</li>
              <li>The program may be paused or ended at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Withdrawals</h2>
            <p className="mt-2">
              Referral wallet credits follow the same withdrawal and eligibility rules as other wallet
              balances, including profile verification and UPI setup where required.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">General terms</h2>
            <p className="mt-2">
              This program is subject to JobPool’s{" "}
              <Link href="/termsandconditions" className="text-indigo-600 hover:underline">
                Terms and Conditions
              </Link>
              . JobPool’s decision on referral eligibility is final.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
