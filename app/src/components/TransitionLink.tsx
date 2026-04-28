"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, ReactNode } from "react";
import { canUseViewTransitions } from "@/lib/viewTransition";

type Props = LinkProps & {
  children: ReactNode;
  className?: string;
  onMouseEnter?: () => void;
  onTouchStart?: () => void;
};

export function TransitionLink({
  href,
  children,
  className,
  onMouseEnter,
  onTouchStart,
  ...rest
}: Props) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey
    ) {
      return;
    }
    if (!canUseViewTransitions()) return;
    e.preventDefault();
    const nav = () => router.push(String(href));
    (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition?.(nav);
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
      {...rest}
    >
      {children}
    </Link>
  );
}
