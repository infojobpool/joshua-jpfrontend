"use client";

import { useEffect, useState } from "react";
import { fetchRefereeStatus } from "@/lib/referral/referralApi";
import { ReferralDashboardPromo } from "./ReferralDashboardPromo";
import { ReferralRefereeBanner } from "./ReferralRefereeBanner";

type Props = {
  userId: string;
};

/** Referee welcome banner takes priority over the general invite promo. */
export function ReferralDashboardAlerts({ userId }: Props) {
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    void fetchRefereeStatus(userId).then((status) => {
      const refereeActive =
        status.was_referred && status.status !== "credited" && status.status !== "none";
      setShowPromo(!refereeActive);
    });
  }, [userId]);

  return (
    <div className="mb-3 space-y-3">
      <ReferralRefereeBanner userId={userId} />
      {showPromo ? <ReferralDashboardPromo /> : null}
    </div>
  );
}
