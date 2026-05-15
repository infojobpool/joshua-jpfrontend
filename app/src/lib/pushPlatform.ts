/** Backend register-push expects platform for token routing / analytics. */

export type PushPlatform = "web" | "ios" | "android";

export function getPushPlatform(): PushPlatform {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "web";
}
