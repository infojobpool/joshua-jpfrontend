/** localStorage key — referral code from ?ref= (30-day TTL via stored timestamp). */
export const REFERRAL_STORAGE_KEY = "jobpool_referral_code";
export const REFERRAL_STORAGE_TS_KEY = "jobpool_referral_code_ts";
export const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Default wallet rewards (INR) until API overrides. */
export const DEFAULT_REFERRER_REWARD_INR = 150;
export const DEFAULT_REFEREE_REWARD_INR = 75;

export const REFERRAL_QUALIFYING_COPY =
  "Rewards credit to your JobPool wallet after your friend completes their first paid task on the platform.";
