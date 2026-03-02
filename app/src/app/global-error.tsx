"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("Global app error:", error.message);
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a" }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: "8px", fontSize: "0.875rem", color: "#64748b" }}>
            Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "24px",
              padding: "10px 20px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
