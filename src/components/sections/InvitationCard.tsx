"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { couple, weddingDate, weddingDetails } from "@/data/wedding";
import { formatDate, formatTime } from "@/lib/utils";

interface InvitationCardProps {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: "confirmed" | "declined";
  numCompanions: number;
  companions: Array<{ name: string }>;
}

export default function InvitationCard({
  guestName,
  guestEmail,
  guestPhone,
  status,
  numCompanions,
  companions,
}: InvitationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formattedDate = formatDate(weddingDate);
  const formattedTime = formatTime(weddingDate);

  const totalGuests = numCompanions + 1;
  const guestList = [guestName, ...companions.map((c) => c.name).filter(Boolean)];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#1F1518",
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `invitacion-${couple.name1}-${couple.name2}-${guestName.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error generating card:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      {/* Hidden card rendered for capture */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <div
            ref={cardRef}
            style={{
              width: 600,
              minHeight: 900,
              fontFamily: "'Jost', sans-serif",
              background:
                "linear-gradient(160deg, #1F1518 0%, #2A1F23 46%, #3A2530 78%, #1F1518 100%)",
              borderRadius: 24,
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
          {/* Silver inner border */}
          <div
            style={{
              border: "2px solid #8A8F98",
              borderRadius: 18,
              padding: 16,
              boxSizing: "border-box",
            }}
          >
          {/* Card content — flex column with explicit gaps */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: 852,
              padding: "24px 28px",
              boxSizing: "border-box",
              position: "relative",
            }}
          >
              {/* ====== TOP: ornament + couple + invitation paragraph ====== */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, width: "100%" }}>
                {/* Top ornament line */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)" }} />
                  <span style={{ color: "#8A8F98", fontSize: 24 }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)" }} />
                </div>

                {/* Couple names — script centerpiece */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Great Vibes', cursive",
                      fontSize: 72,
                      color: "#EAE8EE",
                      lineHeight: 1.15,
                      marginBottom: 14,
                      padding: "0 16px",
                    }}
                  >
                    {couple.name1}
                    <span style={{ color: "#8A8F98", fontSize: 60 }}> & </span>
                    {couple.name2}
                  </div>
                </div>

                {/* Invitation paragraph — client's wording */}
                <div
                  style={{
                    padding: "8px 24px 0 24px",
                    textAlign: "center",
                  }}
                >
                  {status === "confirmed" ? (
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 24,
                        color: "#EAE8EE",
                        lineHeight: 1.55,
                        fontStyle: "italic",
                        margin: 0,
                      }}
                    >
                      Te invitamos a celebrar nuestra boda de plata este {" "}
                      {formattedDate.toLowerCase()} a partir de las 8:00 PM en el {" "}
                      {weddingDetails.reception.location}. Esperamos contar con tu hermosa y agradable compañía para divertirnos a lo grande.
                    </p>
                  ) : (
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 24,
                        color: "#EAE8EE",
                        lineHeight: 1.55,
                        fontStyle: "italic",
                        margin: 0,
                      }}
                    >
                      Te agradecemos tu interés en nuestra boda de plata y apreciamos que nos hayas acompañado con tus deseos.
                    </p>
                  )}
                </div>

                {/* Date + time between silver lines */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    padding: "8px 0 0 0",
                  }}
                >
                  <div style={{ width: 80, height: 1, background: "#8A8F98" }} />
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 22,
                      color: "#EAE8EE",
                      letterSpacing: 0.12,
                      textTransform: "uppercase",
                      margin: 0,
                    }}
                  >
                    {formattedDate}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 32,
                      color: "#8A8F98",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {formattedTime}
                  </p>
                  <div style={{ width: 80, height: 1, background: "#8A8F98" }} />
                </div>
              </div>

              {/* ====== MIDDLE: venue cards (ceremony + reception) ====== */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, width: "100%" }}>
                {/* Ceremony */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(138, 143, 152, 0.4)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 16,
                      color: "#8A8F98",
                      textTransform: "uppercase",
                      letterSpacing: 0.2,
                      margin: "0 0 8px 0",
                    }}
                  >
                    {weddingDetails.ceremony.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 28,
                      color: "#EAE8EE",
                      fontWeight: 600,
                      margin: "0 0 6px 0",
                    }}
                  >
                    {weddingDetails.ceremony.location}
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      color: "#EAE8EE",
                      opacity: 0.6,
                      margin: "0 0 6px 0",
                    }}
                  >
                    {weddingDetails.ceremony.address}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 19,
                      color: "#EAE8EE",
                      opacity: 0.7,
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    {weddingDetails.ceremony.time}
                  </p>
                </div>

                {/* Reception */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 20px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 16,
                      color: "#8A8F98",
                      textTransform: "uppercase",
                      letterSpacing: 0.2,
                      margin: "0 0 8px 0",
                    }}
                  >
                    {weddingDetails.reception.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 28,
                      color: "#EAE8EE",
                      fontWeight: 600,
                      margin: "0 0 6px 0",
                    }}
                  >
                    {weddingDetails.reception.location}
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      color: "#EAE8EE",
                      opacity: 0.6,
                      margin: "0 0 6px 0",
                    }}
                  >
                    {weddingDetails.reception.address}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 19,
                      color: "#EAE8EE",
                      opacity: 0.7,
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    {weddingDetails.reception.time}
                  </p>
                </div>
              </div>

              {/* ====== BOTTOM: guest badge + ornament + footer ====== */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
                {/* Guest info badge */}
                {status === "confirmed" && (
                  <div
                    style={{
                      background: "rgba(138, 143, 152, 0.12)",
                      border: "1px solid rgba(197, 203, 211, 0.25)",
                      borderRadius: 16,
                      padding: "20px 26px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Label */}
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.2,
                        color: "#9CAF88",
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      Confirmado
                    </p>

                    {/* Guest count */}
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 18,
                        color: "#EAE8EE",
                        opacity: 0.6,
                        margin: "8px 0 0 0",
                      }}
                    >
                      {totalGuests} {totalGuests === 1 ? "persona" : "personas"}
                    </p>

                    {/* Divider */}
                    <div
                      style={{
                        width: "60%",
                        height: 1,
                        background: "linear-gradient(90deg, transparent, #8A8F98, transparent)",
                        margin: "12px 0",
                      }}
                    />

                    {/* Guest names listed */}
                    {guestList.map((name, i) => (
                      <p
                        key={i}
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 22,
                          color: "#EAE8EE",
                          margin: "5px 0",
                          fontWeight: i === 0 ? 600 : 400,
                          opacity: i === 0 ? 1 : 0.75,
                        }}
                      >
                        {name}
                      </p>
                    ))}
                  </div>
                )}

                {/* Bottom ornament line */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)" }} />
                  <span style={{ color: "#8A8F98", fontSize: 24 }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #8A8F98, transparent)" }} />
                </div>

                {/* Footer */}
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: "'Great Vibes', cursive",
                      fontSize: 32,
                      color: "#EAE8EE",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {status === "confirmed"
                      ? "Los esperamos con mucho cariño"
                      : "Gracias por tu atención"}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#C5CBD3",
                      opacity: 0.65,
                      margin: 0,
                    }}
                  >
                    {guestEmail}
                  </p>
                  {guestPhone && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#C5CBD3",
                        opacity: 0.65,
                        margin: 0,
                      }}
                    >
                      {guestPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="btn-outline w-full justify-center disabled:opacity-50"
      >
        {isGenerating ? (
          <>Generando invitación...</>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar mi Invitación
          </>
        )}
      </button>
    </div>
  );
}
