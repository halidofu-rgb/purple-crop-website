import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Aperçu de lien (Discord, WhatsApp, X…). 1200×630 : logo, gros titre,
// accroche. Flex uniquement (Satori ne gère pas grid), jamais de valeur
// `undefined` dans un style (fait planter Satori), pas de police custom
// (a déjà cassé le build Vercel).
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Purple Corp — suis ton push ladder et ranked en direct";

export default async function OpengraphImage() {
  const logo = `data:image/png;base64,${readFileSync(join(process.cwd(), "public", "logo.png")).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          backgroundColor: "#161826",
          backgroundImage:
            "radial-gradient(circle at 12% 0%, #262a60 0%, rgba(38,42,96,0) 58%), radial-gradient(circle at 92% 18%, rgba(145,132,217,0.22) 0%, rgba(145,132,217,0) 45%)",
          color: "#e9e9ed",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={96} height={96} style={{ borderRadius: 20 }} />
          <div style={{ display: "flex", marginLeft: 24, fontSize: 28, letterSpacing: 5, textTransform: "uppercase", color: "#b5abfc" }}>
            Brawl Stars
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 30, fontSize: 168, lineHeight: 0.9, letterSpacing: -6, textTransform: "uppercase" }}>
          <span>Purple</span>
          <span style={{ color: "#b5abfc" }}>Corp</span>
        </div>

        <div style={{ display: "flex", marginTop: 30, fontSize: 40, lineHeight: 1.2, color: "#d2cefd" }}>
          Suis ton push ladder et ranked en direct
        </div>
      </div>
    ),
    { ...size }
  );
}
