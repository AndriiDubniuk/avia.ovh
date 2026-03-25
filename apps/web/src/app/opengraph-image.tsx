import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top, rgba(212, 180, 110, 0.32), transparent 28%), linear-gradient(135deg, #163323 0%, #0c1811 100%)",
          color: "#fff8ec",
          padding: "56px 72px",
          justifyContent: "space-between",
          alignItems: "stretch",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "72%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 24,
                background:
                  "linear-gradient(140deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                letterSpacing: "0.2em",
              }}
            >
              A
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ fontSize: 44, letterSpacing: "0.24em" }}>AVIA</span>
              <span
                style={{
                  fontSize: 18,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,248,236,0.72)",
                }}
              >
                Digital Studio
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 24,
              }}
            >
              Сайти, MVP та вебсервіси
            </div>
            <div style={{ fontSize: 76, lineHeight: 1.02, fontWeight: 600 }}>
              Україномовний сервісний сайт під еквайринг
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                color: "rgba(255,248,236,0.76)",
                maxWidth: 780,
                fontFamily: "system-ui",
              }}
            >
              Пакети послуг, стартові ціни, форма заявки, оферта, політика
              конфіденційності та кейс Monibex.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 250,
            borderRadius: 32,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "28px 24px",
          }}
        >
          <div style={{ fontSize: 22, color: "rgba(255,248,236,0.72)" }}>Старт</div>
          <div style={{ marginTop: 14, fontSize: 50, lineHeight: 1.05 }}>25 000 грн</div>
          <div
            style={{
              marginTop: 10,
              fontSize: 24,
              color: "rgba(255,248,236,0.72)",
              fontFamily: "system-ui",
            }}
          >
            за послугу
          </div>
        </div>
      </div>
    ),
    size,
  );
}
