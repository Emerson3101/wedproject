import satori from "satori";
import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";
import { couple, weddingDate, weddingDetails } from "@/data/wedding";
import { formatDate, formatTime } from "@/lib/utils";

/* ============================================
   SERVER-SIDE INVITATION IMAGE GENERATOR
   Satori (JSX → SVG) + Sharp (SVG → PNG)
   Mirrors the static layout of InvitationCard.tsx
   (which uses html2canvas — browser-only, can't
   run server-side). Output is a PNG Buffer for
   email attachment via Nodemailer.
   ============================================ */

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

let fontCache: { [name: string]: ArrayBuffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;

  const files = {
    "Cormorant Garamond": ["CormorantGaramond-400.ttf", "CormorantGaramond-500.ttf", "CormorantGaramond-600.ttf"],
    "Great Vibes": ["GreatVibes-400.ttf"],
    Jost: ["Jost-300.ttf", "Jost-400.ttf", "Jost-500.ttf"],
  };

  const cache: { [name: string]: ArrayBuffer } = {};
  for (const [family, fileNames] of Object.entries(files)) {
    for (const file of fileNames) {
      const buf = await readFile(path.join(FONT_DIR, file));
      const weight = file.match(/-(\d+)\.ttf/)?.[1] || "400";
      const key = `${family}-${weight}`;
      cache[key] = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    }
  }
  fontCache = cache;
  return cache;
}

export async function generateInvitationImage(opts: {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  status: "confirmed" | "declined";
  numCompanions: number;
  companions: Array<{ name: string }>;
}): Promise<Buffer> {
  const { guestName, guestEmail, guestPhone, status, numCompanions, companions } = opts;
  const fonts = await loadFonts();

  const formattedDate = formatDate(weddingDate);
  const formattedTime = formatTime(weddingDate);
  const totalGuests = numCompanions + 1;
  const guestList = [guestName, ...companions.map((c) => c.name).filter(Boolean)];

  const fontEntries = Object.entries(fonts).map(([name, data]) => ({ name, data, weight: Number(name.match(/-(\d+)$/)?.[1] || "400") as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, style: "normal" as const }));

  const svg = await satori(
    <div style={{ width: 600, display: "flex", flexDirection: "column", fontFamily: "Jost", background: "linear-gradient(160deg, #1F1518 0%, #2A1F23 46%, #3A2530 78%, #1F1518 100%)", borderRadius: 24, padding: 16, boxSizing: "border-box" }}>
      <div style={{ display: "flex", flexDirection: "column", borderRadius: 18, border: "2px solid #8A8F98", padding: 16, boxSizing: "border-box" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 28px", width: "100%" }}>
          {/* Top ornament */}
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)" }} />
            <span style={{ color: "#8A8F98", fontSize: 24 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)" }} />
          </div>

          {/* Couple names */}
          <div style={{ fontFamily: "Great Vibes", fontSize: 72, color: "#EAE8EE", lineHeight: 1.15, marginTop: 20, marginBottom: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div>{couple.name1}</div>
            <span style={{ color: "#8A8F98", fontSize: 60 }}>{` & `}</span>
            <div>{couple.name2}</div>
          </div>

          {/* Invitation paragraph */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8, padding: "0 24px" }}>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 24, color: "#EAE8EE", lineHeight: 1.55, fontStyle: "italic", textAlign: "center", margin: 0 }}>
              {status === "confirmed"
                ? `Te invitamos a celebrar nuestra boda de plata este ${formattedDate.toLowerCase()} a partir de las 8:00 PM en el ${weddingDetails.reception.location}. Esperamos contar con tu hermosa y agradable compañía para divertirnos a lo grande.`
                : `Te agradecemos tu interés en nuestra boda de plata y apreciamos que nos hayas acompañado con tus deseos.`}
            </p>
          </div>

          {/* Date + time */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 16 }}>
            <div style={{ width: 80, height: 1, background: "#8A8F98" }} />
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 22, color: "#EAE8EE", letterSpacing: 0.12, textTransform: "uppercase", margin: "6px 0" }}>
              {formattedDate}
            </p>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 32, color: "#8A8F98", fontWeight: 600, margin: 0 }}>
              {formattedTime}
            </p>
            <div style={{ width: 80, height: 1, background: "#8A8F98" }} />
          </div>

          {/* Ceremony */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 20px", borderBottom: "1px solid rgba(138,143,152,0.4)", width: "100%", marginTop: 16, boxSizing: "border-box" }}>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 16, color: "#8A8F98", textTransform: "uppercase", letterSpacing: 0.2, margin: "0 0 8px 0" }}>
              {weddingDetails.ceremony.name}
            </p>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 28, color: "#EAE8EE", fontWeight: 600, margin: "0 0 6px 0" }}>
              {weddingDetails.ceremony.location}
            </p>
            <p style={{ fontFamily: "Jost", fontSize: 16, color: "#EAE8EE", opacity: 0.6, margin: "0 0 6px 0" }}>
              {weddingDetails.ceremony.address}
            </p>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 19, color: "#EAE8EE", fontStyle: "italic", margin: 0, opacity: 0.7 }}>
              {weddingDetails.ceremony.time}
            </p>
          </div>

          {/* Reception */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 16, color: "#8A8F98", textTransform: "uppercase", letterSpacing: 0.2, margin: "0 0 8px 0" }}>
              {weddingDetails.reception.name}
            </p>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 28, color: "#EAE8EE", fontWeight: 600, margin: "0 0 6px 0" }}>
              {weddingDetails.reception.location}
            </p>
            <p style={{ fontFamily: "Jost", fontSize: 16, color: "#EAE8EE", opacity: 0.6, margin: "0 0 6px 0" }}>
              {weddingDetails.reception.address}
            </p>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 19, color: "#EAE8EE", fontStyle: "italic", margin: 0, opacity: 0.7 }}>
              {weddingDetails.reception.time}
            </p>
          </div>

          {/* Guest badge (only if confirmed) */}
          {status === "confirmed" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(138,143,152,0.12)", border: "1px solid rgba(197,203,211,0.25)", borderRadius: 16, padding: "20px 26px", width: "100%", marginTop: 16, boxSizing: "border-box" }}>
              <p style={{ fontFamily: "Cormorant Garamond", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.2, color: "#9CAF88", fontWeight: 600, margin: 0 }}>
                Confirmado
              </p>
              <p style={{ fontFamily: "Cormorant Garamond", fontSize: 18, color: "#EAE8EE", opacity: 0.6, margin: "8px 0 0 0" }}>
                {totalGuests} {totalGuests === 1 ? "persona" : "personas"}
              </p>
              <div style={{ width: "60%", height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)", margin: "12px 0" }} />
              {guestList.map((name, i) => (
                <p key={i} style={{ fontFamily: "Cormorant Garamond", fontSize: 22, color: "#EAE8EE", margin: "5px 0", fontWeight: i === 0 ? 600 : 400, opacity: i === 0 ? 1 : 0.75 }}>
                  {name}
                </p>
              ))}
            </div>
          )}

          {/* Bottom ornament */}
          <div style={{ display: "flex", alignItems: "center", width: "100%", marginTop: 14 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)" }} />
            <span style={{ color: "#8A8F98", fontSize: 24 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)" }} />
          </div>

          {/* Footer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 8 }}>
            <p style={{ fontFamily: "Great Vibes", fontSize: 32, color: "#EAE8EE", margin: "0 0 4px 0" }}>
              {status === "confirmed" ? "Los esperamos con mucho cariño" : "Gracias por tu atención"}
            </p>
            <p style={{ fontFamily: "Jost", fontSize: 13, color: "#C5CBD3", opacity: 0.65, margin: 0 }}>
              {guestEmail}
            </p>
            {guestPhone ? (
              <p style={{ fontFamily: "Jost", fontSize: 13, color: "#C5CBD3", opacity: 0.65, margin: 0 }}>
                {guestPhone}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    {
      width: 600,
      fonts: fontEntries,
    }
  );

  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(1200, null, { fit: "inside" })
    .png()
    .toBuffer();
  return png;
}
