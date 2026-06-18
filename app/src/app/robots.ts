import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

const DISALLOW = [
  "/dashboard/",
  "/profile/",
  "/profilepage/",
  "/messages/",
  "/wallet/",
  "/payments/",
  "/verification/",
  "/settings/",
  "/notifications/",
  "/admin/",
  "/post-task/",
  "/post-task-home/",
  "/tasks/",
  "/bankverification/",
  "/payment-callback/",
  "/emailconfirmation/",
  "/resetpassword/",
  "/forgotpassword/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOW,
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
