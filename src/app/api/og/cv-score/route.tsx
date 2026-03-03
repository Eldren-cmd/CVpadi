import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawName = (searchParams.get("name") || "Nigerian Candidate").trim();
  const rawScore = Number(searchParams.get("score") || "0");
  const safeName = rawName.slice(0, 40) || "Nigerian Candidate";
  const safeScore = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : 0;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background:
            "radial-gradient(circle at top left, rgba(212,80,26,0.24), transparent 36%), linear-gradient(135deg, #1a1410 0%, #2f2217 45%, #5c2b12 100%)",
          color: "#fdfaf4",
          display: "flex",
          fontFamily: "Georgia, serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "60px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                color: "#f4e4d8",
                display: "flex",
                fontFamily: "sans-serif",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 8,
                textTransform: "uppercase",
              }}
            >
              CVPadi
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 66,
                gap: 12,
                lineHeight: 1.05,
                maxWidth: 700,
              }}
            >
              <span>My Nigerian CV Score</span>
              <span style={{ color: "#f4c59f", fontSize: 42, lineHeight: 1.15 }}>
                {safeName}
              </span>
            </div>
          </div>

          <div
            style={{
              color: "#ddd5c4",
              display: "flex",
              flexDirection: "column",
              fontFamily: "sans-serif",
              fontSize: 28,
              gap: 10,
              maxWidth: 620,
              lineHeight: 1.3,
            }}
          >
            <span>Built with CVPadi&apos;s Nigerian CV score engine.</span>
            <span>Check yours and tighten your draft before recruiters do.</span>
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            background: "rgba(253,250,244,0.12)",
            border: "1px solid rgba(253,250,244,0.22)",
            borderRadius: 36,
            display: "flex",
            flexDirection: "column",
            height: 510,
            justifyContent: "center",
            padding: "42px 48px",
            width: 330,
          }}
        >
          <div
            style={{
              color: "#f4e4d8",
              display: "flex",
              fontFamily: "sans-serif",
              fontSize: 22,
              letterSpacing: 6,
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            Score
          </div>
          <div
            style={{
              color: "#ffffff",
              display: "flex",
              fontSize: 196,
              fontWeight: 700,
              lineHeight: 0.9,
            }}
          >
            {String(safeScore)}
          </div>
          <div
            style={{
              color: "#f4c59f",
              display: "flex",
              fontFamily: "sans-serif",
              fontSize: 26,
              fontWeight: 600,
              marginTop: 18,
            }}
          >
            out of 100
          </div>
        </div>
      </div>
    ),
    {
      height: 630,
      width: 1200,
    },
  );
}
