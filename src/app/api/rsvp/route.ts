import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { resendConfig, isResendConfigured } from "@/lib/config";
import { cookies } from "next/headers";
import { sanitizeInput, isValidEmail } from "@/lib/utils";

/* ============================================
   API: POST /api/rsvp
   Recibe y guarda la confirmación de asistencia.
   ============================================ */
export async function POST(request: NextRequest) {
  try {
    const invitationCode = process.env.INVITATION_CODE;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!invitationCode || !adminPassword) {
      return NextResponse.json(
        { error: "Servicio no disponible por error de configuración del servidor." },
        { status: 503 }
      );
    }

    // Verificar sesión (invitado o admin)
    const cookieStore = await cookies();
    const siteCookie = cookieStore.get("site_auth")?.value;
    const adminCookie = cookieStore.get("admin_auth")?.value;

    if (siteCookie !== invitationCode && adminCookie !== adminPassword) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      status,
      numCompanions,
      companions,
      dietary,
      message,
    } = body as {
      name: string;
      email: string;
      phone?: string;
      status: "confirmed" | "declined";
      numCompanions: number;
      companions?: Array<{ name: string; dietary?: string }>;
      dietary?: string;
      message?: string;
    };

    // Sanitización y validaciones de tamaño/formato
    const cleanName = sanitizeInput(name?.trim() || "");
    const cleanEmail = email?.trim() || "";
    const cleanPhone = sanitizeInput(phone?.trim() || "");
    const cleanDietary = sanitizeInput(dietary?.trim() || "");
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
      cleanDietary.length > 500 ||
      cleanMessage.length > 1000
    ) {
      return NextResponse.json(
        { error: "Los datos ingresados exceden el límite de caracteres permitido." },
        { status: 400 }
      );
    }

    const companionsPayload =
      companions && companions.length > 0
        ? companions.map((c) => ({
          name: sanitizeInput(c.name?.trim() || ""),
          dietary_restrictions: c.dietary ? sanitizeInput(c.dietary.trim()) : null,
        }))
        : [];

    // Validar acompañantes
    for (const comp of companionsPayload) {
      if (!comp.name) {
        return NextResponse.json(
          { error: "El nombre del acompañante es requerido." },
          { status: 400 }
        );
      }
      if (comp.name.length > 100 || (comp.dietary_restrictions && comp.dietary_restrictions.length > 500)) {
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
        p_dietary: cleanDietary || null,
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

    // Enviar email de confirmación con Resend
    if (isResendConfigured && status === "confirmed") {
      await sendConfirmationEmail(name, email).catch((err) => {
        console.error("Error sending confirmation email:", err);
      });
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
    const invitationCode = process.env.INVITATION_CODE;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!invitationCode || !adminPassword) {
      return NextResponse.json(
        { error: "Servicio no disponible por error de configuración del servidor." },
        { status: 503 }
      );
    }

    // Verificar sesión (invitado o admin)
    const cookieStore = await cookies();
    const siteCookie = cookieStore.get("site_auth")?.value;
    const adminCookie = cookieStore.get("admin_auth")?.value;

    if (siteCookie !== invitationCode && adminCookie !== adminPassword) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

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
   EMAIL DE CONFIRMACIÓN — Resend
   ============================================ */
async function sendConfirmationEmail(name: string, email: string) {
  const { Resend } = await import("resend");
  const resend = new Resend(resendConfig.apiKey);

  await resend.emails.send({
    from: resendConfig.fromEmail,
    to: email,
    subject: `¡Gracias por confirmar, ${name}! 💕`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #FFFFF0, #F7E7CE); border-radius: 24px;">
        <div style="text-align: center;">
          <p style="font-size: 48px; color: #C5A55A; margin-bottom: 16px;">❦</p>
          <h1 style="font-size: 36px; color: #722F37; margin-bottom: 8px;">¡Confirmación Recibida!</h1>
          <p style="font-size: 18px; color: #722F37; opacity: 0.7; margin-bottom: 32px;">
            Gracias ${name}, estamos ansiosos por celebrar contigo.
          </p>
          <div style="width: 60px; height: 1px; background: #C5A55A; margin: 0 auto 32px;"></div>
          <p style="font-size: 16px; color: #722F37; line-height: 1.8;">
            <strong>Fecha:</strong> 18 de Octubre, 2025<br/>
            <strong>Ceremonia:</strong> 4:00 PM — Iglesia Santa María<br/>
            <strong>Recepción:</strong> 7:00 PM — Salón Jardines del Parque
          </p>
          <p style="font-size: 24px; color: #C5A55A; margin-top: 32px;">
            Alma & Chava
          </p>
        </div>
      </div>
    `,
  });
}
