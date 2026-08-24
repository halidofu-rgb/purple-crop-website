import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Runtime Node (pas Edge, par défaut) pour pouvoir lire le logo depuis le
// disque avec fs — plus simple et plus fiable qu'un fetch réseau pour un
// asset qu'on a déjà dans public/.
export const runtime = "nodejs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoBuffer = readFileSync(join(process.cwd(), "public", "logo.png"));
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#161826",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(145,132,217,0.35), transparent 55%), radial-gradient(circle at 85% 85%, rgba(69,224,208,0.15), transparent 50%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoBase64} width={160} height={160} style={{ borderRadius: 32 }} />
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 80,
            fontWeight: 600,
            letterSpacing: -2,
            color: "#e9e9ed",
            textTransform: "uppercase",
          }}
        >
          <span>Purple&nbsp;</span>
          <span style={{ color: "#b5abfc" }}>Corp</span>
        </div>
        <div style={{ marginTop: 14, fontSize: 30, color: "#9397ab" }}>
          Le classement et les stats, en direct
        </div>
      </div>
    ),
    { ...size }
  );
}
