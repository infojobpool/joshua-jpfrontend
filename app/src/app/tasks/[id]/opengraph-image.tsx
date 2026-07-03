import { ImageResponse } from "next/og";
import { fetchPublicTaskForSeo } from "@/lib/publicTask";

export const runtime = "edge";
export const alt = "JobPool task";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OpenGraphImage({ params }: PageProps) {
  const { id } = await params;
  const task = await fetchPublicTaskForSeo(id);

  const title = task?.title?.trim() || "Task on JobPool";
  const budget =
    task && task.budget > 0
      ? `₹${Math.round(task.budget).toLocaleString("en-IN")}`
      : "Open for bids";
  const location = task?.location?.trim() || "India";
  const category = task?.categoryName?.trim() || "Task";
  const imageUrl = task?.imageUrl;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 45%, #4f46e5 100%)",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 56px",
            color: "white",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              JP
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>JobPool</span>
              <span style={{ fontSize: 18, opacity: 0.88 }}>Get tasks done across India</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: imageUrl ? 640 : 980 }}>
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {category}
            </div>
            <div
              style={{
                fontSize: 54,
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: -1,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 26, fontWeight: 600 }}>
              <span
                style={{
                  background: "rgba(255,255,255,0.95)",
                  color: "#1d4ed8",
                  padding: "10px 20px",
                  borderRadius: 12,
                }}
              >
                {budget}
              </span>
              <span style={{ opacity: 0.92, alignSelf: "center" }}>{location}</span>
            </div>
          </div>

          <div style={{ fontSize: 20, opacity: 0.82 }}>www.jobpool.in</div>
        </div>

        {imageUrl ? (
          <div
            style={{
              width: 420,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "36px 36px 36px 0",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 24,
                overflow: "hidden",
                border: "4px solid rgba(255,255,255,0.35)",
                display: "flex",
                boxShadow: "0 24px 48px rgba(15,23,42,0.28)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                width={380}
                height={558}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </div>
          </div>
        ) : null}
      </div>
    ),
    { ...size },
  );
}
