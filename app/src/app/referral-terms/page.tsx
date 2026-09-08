import type { Metadata } from "next";
import Link from "next/link";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import {
  DEFAULT_REFEREE_REWARD_INR,
  DEFAULT_REFERRER_REWARD_INR,
  REFERRAL_QUALIFYING_COPY,
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
        <p className="mt-2 text-slate-600 text-sm">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
            <p className="mt-2">
              JobPool’s referral program rewards existing users (<strong>referrers</strong>) and new users they
              invite (<strong>referees</strong>) with wallet credit when qualifying conditions are met. Rewards
              are promotional credits in your JobPool wallet, not cash unless withdrawn under normal wallet
              rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Current reward amounts</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>
                Referrer: up to <strong>₹{DEFAULT_REFERRER_REWARD_INR}</strong> wallet credit per successful
                referral
              </li>
              <li>
                Referee (invited friend): up to <strong>₹{DEFAULT_REFEREE_REWARD_INR}</strong> wallet credit
              </li>
            </ul>
            <p className="mt-2 text-sm text-slate-600">
              Amounts may change. The amount shown in the app at the time of invite or signup applies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">How a referral qualifies</h2>
            <p className="mt-2">{REFERRAL_QUALIFYING_COPY}</p>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
              <li>The referee must be a new JobPool user who has not previously registered.</li>
              <li>The referee must sign up using the referrer’s valid link or code.</li>
              <li>
                Only one referrer per new account — the first valid code or link used at registration counts.
              </li>
              <li>
                The referee must complete a genuine paid task (as poster or tasker, per program rules set by
                JobPool) that is not cancelled, refunded, or flagged as fraudulent.
              </li>
              <li>JobPool may set a minimum task value or other conditions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">When credits are paid</h2>
            <p className="mt-2">
              Wallet credits are issued after JobPool confirms the qualifying task is complete and payment has
              settled. This may take up to 48 hours. Credits appear in your wallet transaction history as
              referral bonus entries.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Fair use &amp; limits</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
              <li>Self-referrals, duplicate accounts, or fake tasks are not eligible.</li>
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
              This program is part of your use of JobPool and is subject to our{" "}
              <Link href="/termsandconditions" className="text-indigo-600 hover:underline">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </Link>
              . JobPool’s decision on referral eligibility is final.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
