import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { gmailConfig, isGmailConfigured } from "@/lib/config";
import { requireGuestOrAdmin } from "@/lib/auth";
import { sanitizeInput, isValidEmail } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { couple, weddingDetails } from "@/data/wedding";

const MAX_COMPANIONS = 2;
const RATE_LIMIT_RSVPS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const EMAIL_COOLDOWN_RSVPS = 1;
const EMAIL_COOLDOWN_WINDOW = 60 * 60 * 1000;
const MAX_BODY_BYTES = 16_000;

/* ============================================
   API: POST /api/rsvp
   Recibe y guarda la confirmación de asistencia.
   ============================================ */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireGuestOrAdmin();
    if (!auth.ok) return auth.response;

    const clientIp = getClientIp(request);

    const ipLimit = rateLimit(
      `rsvp:ip:${clientIp}`,
      RATE_LIMIT_RSVPS,
      RATE_LIMIT_WINDOW
    );
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(ipLimit.resetMs / 1000)) } }
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "La solicitud excede el tamaño permitido." },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawBody);
    const {
      name,
      email,
      phone,
      status,
      numCompanions,
      companions,
      message,
    } = body as {
      name: string;
      email: string;
      phone?: string;
      status: "confirmed" | "declined";
      numCompanions: number;
      companions?: Array<{ name: string }>;
      message?: string;
    };

    if (status !== "confirmed" && status !== "declined") {
      return NextResponse.json(
        { error: "Estado de asistencia inválido." },
        { status: 400 }
      );
    }

    const companionsCount = numCompanions || 0;
    if (typeof numCompanions === "number" && companionsCount > MAX_COMPANIONS) {
      return NextResponse.json(
        { error: "El número de acompañantes excede el límite." },
        { status: 400 }
      );
    }

    const companionsPayload =
      companions && companions.length > 0
        ? companions.map((c) => ({
          name: sanitizeInput(c.name?.trim() || ""),
          dietary_restrictions: null as string | null,
        }))
        : [];

    if (companionsPayload.length > MAX_COMPANIONS) {
      return NextResponse.json(
        { error: "El número de acompañantes excede el límite." },
        { status: 400 }
      );
    }

    // Sanitización y validaciones de tamaño/formato.
    // dietary_restrictions se envía siempre como null desde el frontend:
    // el campo se eliminó del formulario pero se conserva en el schema/RPC.
    const cleanName = sanitizeInput(name?.trim() || "");
    const cleanEmail = email?.trim() || "";
    const cleanPhone = sanitizeInput(phone?.trim() || "");
    const cleanMessage = sanitizeInput(message?.trim() || "");

    if (!cleanName || !cleanEmail) {
      return NextResponse.json(
        { error: "El nombre y el email son requeridos." },
        { status: 400 }
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "Por favor, ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (
      cleanName.length > 100 ||
      cleanPhone.length > 20 ||
      cleanMessage.length > 1000
    ) {
      return NextResponse.json(
        { error: "Los datos ingresados exceden el límite de caracteres permitido." },
        { status: 400 }
      );
    }

    // Validar acompañantes
    for (const comp of companionsPayload) {
      if (!comp.name) {
        return NextResponse.json(
          { error: "El nombre del acompañante es requerido." },
          { status: 400 }
        );
      }
      if (comp.name.length > 100) {
        return NextResponse.json(
          { error: "Los datos de los acompañantes exceden el límite de caracteres permitido." },
          { status: 400 }
        );
      }
    }

    const supabase = createSupabaseServerClient();

    if (supabase) {
      const { error: rsvpError } = await supabase.rpc("submit_rsvp", {
        p_name: cleanName,
        p_email: cleanEmail,
        p_phone: cleanPhone || null,
        p_status: status,
        p_num_companions: numCompanions || 0,
        p_dietary: null,
        p_message: cleanMessage || null,
        p_side: null,
        p_companions: companionsPayload,
      });

      if (rsvpError) {
        console.error("Supabase RSVP error:", rsvpError);
        return NextResponse.json(
          { error: "No se pudo guardar tu confirmación. Intenta de nuevo." },
          { status: 500 }
        );
      }
    } else {
      console.warn(
        "Supabase no configurado. RSVP guardado solo en logs:",
        { name, email, status, numCompanions }
      );
    }

    // Enviar email de confirmación via Gmail SMTP (Nodemailer).
    // Pasamos cleanName/cleanEmail (versiones saneadas/escapadas) para que el cuerpo
    // HTML del email no sea vulnerable a inyección y refleje exactamente lo almacenado.
    console.log("[RSVP] isGmailConfigured:", isGmailConfigured, "| status:", status);
    if (isGmailConfigured && status === "confirmed") {
      const emailKey = `rsvp:email:${cleanEmail.toLowerCase()}`;
      const emailLimit = rateLimit(emailKey, EMAIL_COOLDOWN_RSVPS, EMAIL_COOLDOWN_WINDOW);
      if (!emailLimit.ok) {
        console.log("[RSVP] Email cooldown active, skipping send to:", cleanEmail);
      } else {
        console.log("[RSVP] Sending confirmation email to:", cleanEmail);
        await sendConfirmationEmail(
          cleanName,
          cleanEmail,
          cleanPhone || undefined,
          status,
          numCompanions || 0,
          companionsPayload.map((c) => ({ name: c.name }))
        ).catch((err) => {
          console.error("[RSVP] Email send failed:", err.message);
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `¡Gracias ${name}! Tu confirmación ha sido recibida.`,
    });
  } catch (error) {
    console.error("RSVP API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/* ============================================
   API: GET /api/rsvp
   Verificar estado de un invitado por email.
   ============================================ */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireGuestOrAdmin();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "El email es requerido." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ status: "unknown" });
    }

    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: "not_found" });
    }

    return NextResponse.json({ status: data.status, name: data.name });
  } catch (error) {
    console.error("RSVP GET error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/* ============================================
   EMAIL DE CONFIRMACIÓN — Gmail SMTP (Nodemailer)
   Adjunta la invitación personalizada como PNG
   (generada server-side vía Satori + Sharp).
   ============================================ */
async function sendConfirmationEmail(
  name: string,
  email: string,
  phone: string | undefined,
  status: "confirmed" | "declined",
  numCompanions: number,
  companions: Array<{ name: string }>
) {
  const nodemailer = await import("nodemailer");
  const { generateInvitationImage } = await import("@/lib/generateInvitationImage");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailConfig.user,
      pass: gmailConfig.appPassword,
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
  try {
    const png = await generateInvitationImage({
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      status,
      numCompanions,
      companions,
    });
    attachments = [{
      filename: `invitacion-${name.replace(/\s+/g, "-")}.png`,
      content: png,
      contentType: "image/png",
    }];
  } catch (err) {
    console.error("[RSVP Email] Failed to generate invitation image:", err instanceof Error ? err.message : err);
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #F6F5F8, #EAE8EE); border-radius: 24px;">
      <div style="text-align: center;">
        <p style="font-size: 48px; color: #8A8F98; margin-bottom: 16px;">❦</p>
        <h1 style="font-size: 36px; color: #722F37; margin-bottom: 8px;">¡Confirmación Recibida!</h1>
        <p style="font-size: 18px; color: #722F37; opacity: 0.7; margin-bottom: 32px;">
          Gracias ${name}, estamos ansiosos por celebrar contigo.
        </p>
        <div style="width: 60px; height: 1px; background: #8A8F98; margin: 0 auto 32px;"></div>
        <p style="font-size: 16px; color: #722F37; line-height: 1.8;">
          <strong>Fecha:</strong> ${weddingDetails.ceremony.date}<br/>
          <strong>Ceremonia:</strong> ${weddingDetails.ceremony.time} — ${weddingDetails.ceremony.location}<br/>
          <strong>Recepción:</strong> ${weddingDetails.reception.time} — ${weddingDetails.reception.location}
        </p>
        <p style="font-size: 14px; color: #722F37; opacity: 0.6; margin: 32px 0;">
          Adjuntamos tu invitación digital personalizada a este correo.
          ${attachments.length === 0 ? `También puedes verla en línea:` : `También puedes verla en línea:`}
        </p>
        <a href="${siteUrl}" style="display: inline-block; padding: 14px 36px; background: #722F37; color: #F6F5F8; text-decoration: none; border-radius: 999px; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; font-family: 'Jost', -apple-system, sans-serif; margin-top: 8px;">
          Ver en línea
        </a>
        <p style="font-size: 24px; color: #8A8F98; margin-top: 32px;">
          ${couple.name1} & ${couple.name2}
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Alma & Chava" <${gmailConfig.user}>`,
    to: email,
    subject: `¡Gracias por confirmar, ${name}! 💕`,
    html,
    attachments,
  });
}
