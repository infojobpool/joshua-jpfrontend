/** localStorage key — referral code from ?ref= (30-day TTL via stored timestamp). */
export const REFERRAL_STORAGE_KEY = "jobpool_referral_code";
export const REFERRAL_STORAGE_TS_KEY = "jobpool_referral_code_ts";
export const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** New-user welcome wallet credit (same checklist as payout profile). */
export const WELCOME_BONUS_INR = 25;

/** Referrer earns this amount each time this many invited users finish full verification. */
export const REFERRAL_MILESTONE_VERIFIED_COUNT = 3;
export const REFERRAL_MILESTONE_REWARD_INR = 25;

/** @deprecated Use milestone fields on summary; kept for API fallbacks. */
export const DEFAULT_REFERRER_REWARD_INR = REFERRAL_MILESTONE_REWARD_INR;
/** @deprecated Invited users get welcome bonus only. */
export const DEFAULT_REFEREE_REWARD_INR = WELCOME_BONUS_INR;

export const REFERRAL_QUALIFYING_COPY =
  `Earn ₹${REFERRAL_MILESTONE_REWARD_INR} in your wallet each time ${REFERRAL_MILESTONE_VERIFIED_COUNT} friends sign up with your link and complete all profile & payout verification steps (same checklist as the ₹${WELCOME_BONUS_INR} welcome bonus). Repeats for every ${REFERRAL_MILESTONE_VERIFIED_COUNT} verified friends.`;

export const REFERRAL_INVITE_TAGLINE =
  `Share your link — friends get ₹${WELCOME_BONUS_INR} welcome bonus after verification; you get ₹${REFERRAL_MILESTONE_REWARD_INR} for every ${REFERRAL_MILESTONE_VERIFIED_COUNT} verified invites.`;

export const REFEREE_PENDING_KEY = "jobpool_referee_bonus_pending";
export const REFEREE_BANNER_DISMISSED_KEY = "jobpool_referee_banner_dismissed";
export const REFERRAL_PROMO_DISMISSED_KEY = "jobpool_referral_promo_dismissed";
