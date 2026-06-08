"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { couple, weddingDate, weddingDetails } from "@/data/wedding";

interface InvitationCardProps {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: "confirmed" | "declined";
  numCompanions: number;
  companions: Array<{ name: string; dietary: string }>;
  dietary: string;
}

export default function InvitationCard({
  guestName,
  guestEmail,
  guestPhone,
  status,
  numCompanions,
  companions,
  dietary,
}: InvitationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formattedDate = weddingDate.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = weddingDate.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });

  const totalGuests = numCompanions + 1;
  const guestList = [guestName, ...companions.map((c) => c.name).filter(Boolean)];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFF0",
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
            minHeight: 820,
            fontFamily: "'Jost', sans-serif",
            background:
              "linear-gradient(160deg, #FFFFF0 0%, #F7E7CE 40%, #F4C2C2 70%, #FFFFF0 100%)",
            borderRadius: 24,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {/* Gold inner border */}
          <div
            style={{
              border: "2px solid #C5A55A",
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
                minHeight: 772,
                padding: "20px 24px",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              {/* ====== TOP: ornament + couple + date ====== */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
                {/* Top ornament line */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #C5A55A, transparent)" }} />
                  <span style={{ color: "#C5A55A", fontSize: 18 }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #C5A55A, transparent)" }} />
                </div>

                {/* Couple names */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Great Vibes', cursive",
                      fontSize: 52,
                      color: "#722F37",
                      lineHeight: 1.15,
                      marginBottom: 8,
                      padding: "0 16px",
                    }}
                  >
                    {couple.name1}
                    <span style={{ color: "#C5A55A", fontSize: 44 }}> & </span>
                    {couple.name2}
                  </div>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 14,
                      color: "#722F37",
                      opacity: 0.7,
                      letterSpacing: 0.08,
                      textTransform: "uppercase",
                      margin: 0,
                    }}
                  >
                    {status === "confirmed"
                      ? "te invitan a celebrar su boda"
                      : "te agradece tu interés en su boda"}
                  </p>
                </div>

                {/* Date + time between gold lines */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    width: "100%",
                    padding: "12px 0",
                  }}
                >
                  <div style={{ width: 80, height: 1, background: "#C5A55A" }} />
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 17,
                      color: "#722F37",
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
                      fontSize: 24,
                      color: "#C5A55A",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {formattedTime}
                  </p>
                  <div style={{ width: 80, height: 1, background: "#C5A55A" }} />
                </div>
              </div>

              {/* ====== MIDDLE: event details ====== */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, width: "100%" }}>
                {/* Ceremony */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "14px 20px",
                    borderBottom: "1px solid rgba(197, 165, 90, 0.3)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 12,
                      color: "#C5A55A",
                      textTransform: "uppercase",
                      letterSpacing: 0.2,
                      margin: "0 0 6px 0",
                    }}
                  >
                    {weddingDetails.ceremony.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 22,
                      color: "#722F37",
                      fontWeight: 600,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {weddingDetails.ceremony.location}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#722F37",
                      opacity: 0.6,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {weddingDetails.ceremony.address}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 15,
                      color: "#722F37",
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
                    padding: "14px 20px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 12,
                      color: "#C5A55A",
                      textTransform: "uppercase",
                      letterSpacing: 0.2,
                      margin: "0 0 6px 0",
                    }}
                  >
                    {weddingDetails.reception.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 22,
                      color: "#722F37",
                      fontWeight: 600,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {weddingDetails.reception.location}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#722F37",
                      opacity: 0.6,
                      margin: "0 0 4px 0",
                    }}
                  >
                    {weddingDetails.reception.address}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 15,
                      color: "#722F37",
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%" }}>
                {/* Guest info badge */}
                {status === "confirmed" && (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      border: "1px solid rgba(197, 165, 90, 0.35)",
                      borderRadius: 16,
                      padding: "18px 24px",
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
                        fontSize: 11,
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
                        fontSize: 14,
                        color: "#722F37",
                        opacity: 0.6,
                        margin: "6px 0 0 0",
                      }}
                    >
                      {totalGuests} {totalGuests === 1 ? "persona" : "personas"}
                    </p>

                    {/* Divider */}
                    <div
                      style={{
                        width: "60%",
                        height: 1,
                        background: "linear-gradient(90deg, transparent, #C5A55A, transparent)",
                        margin: "12px 0",
                      }}
                    />

                    {/* Guest names listed */}
                    {guestList.map((name, i) => (
                      <p
                        key={i}
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 18,
                          color: "#722F37",
                          margin: "4px 0",
                          fontWeight: i === 0 ? 600 : 400,
                          opacity: i === 0 ? 1 : 0.75,
                        }}
                      >
                        {name}
                      </p>
                    ))}

                    {/* Dietary info */}
                    {dietary && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "#722F37",
                          opacity: 0.5,
                          margin: "10px 0 0 0",
                          fontStyle: "italic",
                        }}
                      >
                        <span style={{ fontStyle: "normal", textTransform: "uppercase", letterSpacing: 0.06, fontSize: 10 }}>
                          Restricciones:
                        </span>{" "}
                        {dietary}
                      </p>
                    )}
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
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #C5A55A, transparent)" }} />
                  <span style={{ color: "#C5A55A", fontSize: 18 }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #C5A55A, transparent)" }} />
                </div>

                {/* Footer */}
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: "'Great Vibes', cursive",
                      fontSize: 26,
                      color: "#722F37",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {status === "confirmed"
                      ? "¡Te esperamos con mucho gusto!"
                      : "Gracias por tu atención"}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#722F37",
                      opacity: 0.35,
                      margin: 0,
                    }}
                  >
                    {guestEmail}
                  </p>
                  {guestPhone && (
                    <p
                      style={{
                        fontSize: 10,
                        color: "#722F37",
                        opacity: 0.35,
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
