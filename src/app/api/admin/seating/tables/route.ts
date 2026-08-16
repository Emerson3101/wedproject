import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";
import { sanitizeInput } from "@/lib/utils";

/* ============================================
   API: POST /api/admin/seating/tables
   Crea una mesa nueva. display_order = max+1.
   Body: { name, capacity?, shape? }
   ============================================ */

const SHAPE_VALUES = new Set(["round", "rect"]);

export async function POST(request: NextRequest) {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;
  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  let body: { name?: string; capacity?: number; shape?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo de la petición inválido." },
      { status: 400 }
    );
  }

  const cleanName = sanitizeInput(body.name?.trim() || "");
  if (!cleanName) {
    return NextResponse.json(
      { ok: false, error: "El nombre de la mesa es requerido." },
      { status: 400 }
    );
  }
  if (cleanName.length > 100) {
    return NextResponse.json(
      { ok: false, error: "El nombre de la mesa no puede exceder 100 caracteres." },
      { status: 400 }
    );
  }

  let capacity = 8;
  if (body.capacity !== undefined) {
    capacity = Number(body.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
      return NextResponse.json(
        { ok: false, error: "La capacidad debe ser un entero entre 1 y 50." },
        { status: 400 }
      );
    }
  }

  let shape: "round" | "rect" = "round";
  if (body.shape !== undefined) {
    if (!SHAPE_VALUES.has(body.shape)) {
      return NextResponse.json(
        { ok: false, error: "La forma debe ser 'round' o 'rect'." },
        { status: 400 }
      );
    }
    shape = body.shape as "round" | "rect";
  }

  const supabase = createSupabaseServerClient()!;

  // display_order = max(display_order) + 1
  const { data: maxRow, error: maxErr } = await supabase
    .from("seating_tables")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) {
    console.error("Admin seating — error computing display_order:", maxErr);
    return NextResponse.json({ ok: false, error: "No se pudo calcular el orden." }, { status: 500 });
  }

  const nextOrder = (maxRow?.display_order ?? -1) + 1;

  const { data: table, error: insertErr } = await supabase
    .from("seating_tables")
    .insert({
      name: cleanName,
      capacity,
      shape,
      display_order: nextOrder,
    })
    .select()
    .single();

  if (insertErr || !table) {
    console.error("Admin seating — error inserting table:", insertErr);
    return NextResponse.json(
      { ok: false, error: "No se pudo crear la mesa." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, table }, { status: 201 });
}
