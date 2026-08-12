import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 50% 118%, rgba(70,180,140,0.30), transparent 46%), linear-gradient(180deg, #04050A 0%, #0A1026 62%, #101E38 100%)",
          color: "#F4F1EA",
          padding: "56px 64px",
          justifyContent: "space-between",
          alignItems: "stretch",
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 1,
            background: "rgba(207,232,228,0.16)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "70%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 24,
                letterSpacing: "0.44em",
                fontWeight: 700,
              }}
            >
              AVIA
            </span>
            <span
              style={{
                fontFamily: mono,
                fontSize: 15,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#79E3C4",
              }}
            >
              Цифрові продукти
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 74,
                lineHeight: 1.0,
                fontWeight: 800,
                letterSpacing: "-0.045em",
              }}
            >
              <span>Сайти, MVP і кабінети</span>
              <span>під бізнес-задачу</span>
            </div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 21,
                lineHeight: 1.7,
                letterSpacing: "0.04em",
                color: "rgba(207,232,228,0.72)",
                maxWidth: 700,
              }}
            >
              Шість форматів, публічні стартові ціни, реальні кейси.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 258,
            border: "1px solid rgba(207,232,228,0.18)",
            background: "rgba(10,16,38,0.5)",
            padding: "30px 26px",
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 13,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(138,147,168,1)",
            }}
          >
            Напрямки
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 22,
              lineHeight: 1.25,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#79E3C4",
            }}
          >
            Сайти · Застосунки
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 22,
              lineHeight: 1.25,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#79E3C4",
            }}
          >
            Кастомні системи
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 22,
              lineHeight: 1.25,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#79E3C4",
            }}
          >
            AI · Маркетинг
          </div>
        </div>
      </div>
    ),
    size,
  );
}
