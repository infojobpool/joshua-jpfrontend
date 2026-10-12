import { WELCOME_BONUS_INR } from "@/lib/referral/constants";

export { WELCOME_BONUS_INR };

export function welcomeBonusInrLabel(): string {
  return `₹${WELCOME_BONUS_INR}`;
}

export function welcomeBonusProgressLabel(completed: number, total: number, remaining: number): string {
  return `${completed} of ${total} steps toward ${welcomeBonusInrLabel()} bonus · ${remaining} left`;
}
