import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Aperçu de lien (Discord, WhatsApp, X…). 1200×630, charte Purple Corp :
// fond ink, bannière section en haut à gauche, deux lignes violettes,
// une seule carte saturée (Purple Line). Flex uniquement — Satori ne gère
// pas grid, mask-image ni skew.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Purple Corp — classement, push et Ranked en direct";

async function googleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`, {
        headers: { "User-Agent": "Mozilla/5.0" }, // force un format lisible par Satori (ttf)
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null; // pas de réseau au build → police par défaut, l'image reste générée
  }
}

// Seuils et rôles alignés sur le texte "Notre histoire" de la home
// (app/page.tsx) — à garder synchronisé si ces chiffres bougent encore.
const CLUBS = [
  { name: "Purple Line", role: "Club principal", min: "140K", lead: true },
  { name: "Indigo Line", role: "Confirmé", min: "130K" },
  { name: "Iris Line", role: "Confirmé", min: "110K" },
  { name: "Orchid Line", role: "Académie", min: "80K" },
];

export default async function OpengraphImage() {
  const logo = `data:image/png;base64,${readFileSync(join(process.cwd(), "public", "logo.png")).toString("base64")}`;
  const [inter, mono] = await Promise.all([googleFont("Inter", 500), googleFont("JetBrains+Mono", 500)]);

  const fonts = [
    ...(inter ? [{ name: "Inter", data: inter, weight: 500 as const, style: "normal" as const }] : []),
    ...(mono ? [{ name: "Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          backgroundColor: "#161826",
          backgroundImage:
            "radial-gradient(circle at 12% 0%, #262a60 0%, rgba(38,42,96,0) 58%), radial-gradient(circle at 92% 18%, rgba(145,132,217,0.22) 0%, rgba(145,132,217,0) 45%)",
          color: "#e9e9ed",
          fontFamily: "Inter",
        }}
      >
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 600, width: 3, backgroundImage: "linear-gradient(to bottom, rgba(181,171,252,0.55), rgba(181,171,252,0))" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 628, width: 3, backgroundImage: "linear-gradient(to bottom, rgba(181,171,252,0.22), rgba(181,171,252,0))" }} />

        {/* gauche */}
        <div style={{ display: "flex", flexDirection: "column", width: 600, padding: "56px 40px 56px 64px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={76} height={76} style={{ borderRadius: 16 }} />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 18, fontSize: 24, letterSpacing: 4, textTransform: "uppercase" }}>
              <span style={{ color: "#b5abfc" }}>Brawl Stars</span>
              <span style={{ color: "#9397ab", marginTop: 4 }}>Communauté FR</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 34, fontSize: 128, lineHeight: 0.86, letterSpacing: -6, textTransform: "uppercase" }}>
            <span>Purple</span>
            <span style={{ color: "#b5abfc", textShadow: "0 0 70px rgba(181,171,252,0.55)" }}>Corp</span>
          </div>

          <div style={{ display: "flex", marginTop: "auto", fontSize: 34, lineHeight: 1.2, color: "#d2cefd" }}>
            Classement, push et Ranked en direct.
          </div>
        </div>

        {/* droite */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 600, padding: "48px 64px 48px 52px" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#9397ab", marginBottom: 16 }}>
            4 clubs
          </div>

          {CLUBS.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: i === 0 ? 0 : 10,
                padding: "16px 24px",
                borderRadius: 16,
                border: c.lead ? "3px solid rgba(181,171,252,0.55)" : "3px solid rgba(233,233,237,0.16)",
                backgroundColor: c.lead ? undefined : "#232532",
                backgroundImage: c.lead ? "linear-gradient(120deg, rgba(66,58,106,0.75), rgba(35,37,50,0.9))" : undefined,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 36, lineHeight: 1, letterSpacing: -1, textTransform: "uppercase" }}>{c.name}</span>
                <span style={{ fontSize: 20, marginTop: 7, color: c.lead ? "#d2cefd" : "#b2b6ca" }}>{c.role}</span>
              </div>
              <span style={{ fontFamily: mono ? "Mono" : "Inter", fontSize: 42, letterSpacing: -2, color: c.lead ? "#b5abfc" : "#d2cefd" }}>
                {c.min}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
