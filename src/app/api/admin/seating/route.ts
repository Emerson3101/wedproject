import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  type Guest,
  type Companion,
  type SeatingTable,
  type SeatingSeat,
} from "@/lib/supabase";
import { isSupabaseServerConfigured } from "@/lib/config";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin({ wrapOk: true });
  if (!auth.ok) return auth.response;
  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured. Check .env.local" },
      { status: 503 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  // Cargamos todo en paralelo: mesas, asientos, invitados confirmados y
  // companions en vivo. Unimos en JS Los asientos se resolviendo el lead
  // (guest_id) con su companions count vivo para detectar drift.
  const [tablesRes, seatsRes, guestsRes, companionsRes] = await Promise.all([
    supabase
      .from("seating_tables")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("seating_seats")
      .select("*")
      .order("seat_index", { ascending: true }),
    supabase
      .from("guests")
      .select("id, name, email, phone, status, side, created_at")
      .eq("status", "confirmed")
      .order("name", { ascending: true }),
    supabase
      .from("companions")
      .select("id, guest_id, name, created_at")
      .order("created_at", { ascending: true }),
  ]);

  if (tablesRes.error) {
    console.error("Admin seating — error fetching tables:", tablesRes.error);
    return NextResponse.json({ ok: false, error: tablesRes.error.message }, { status: 500 });
  }
  if (seatsRes.error) {
    console.error("Admin seating — error fetching seats:", seatsRes.error);
    return NextResponse.json({ ok: false, error: seatsRes.error.message }, { status: 500 });
  }
  if (guestsRes.error) {
    console.error("Admin seating — error fetching confirmed guests:", guestsRes.error);
    return NextResponse.json({ ok: false, error: guestsRes.error.message }, { status: 500 });
  }
  if (companionsRes.error) {
    console.error("Admin seating — error fetching companions:", companionsRes.error);
    // No bloqueamos: seguimos sin drift detection.
  }

  const tables = (tablesRes.data || []) as SeatingTable[];
  const seats = (seatsRes.data || []) as SeatingSeat[];
  const confirmedGuests = (guestsRes.data || []) as Guest[];
  const companions = (companionsRes.data || []) as Companion[];

  // Mapas auxiliares
  const companionsByGuest = new Map<string, Companion[]>();
  for (const c of companions) {
    const list = companionsByGuest.get(c.guest_id) || [];
    list.push(c);
    companionsByGuest.set(c.guest_id, list);
  }

  const guestsById = new Map<string, Guest>();
  for (const g of confirmedGuests) guestsById.set(g.id, g);

  // seats con guest_id (lead) ->Party-key index
  const seatsByGuestId = new Map<string, SeatingSeat>();
  for (const s of seats) if (s.guest_id) seatsByGuestId.set(s.guest_id, s);

  // Asientos agrupados por table_id
  const seatsByTable = new Map<string, SeatingSeat[]>();
  for (const s of seats) {
    const list = seatsByTable.get(s.table_id) || [];
    list.push(s);
    seatsByTable.set(s.table_id, list);
  }

  // Companions snapshot por party_key (para drift detection)
  const snapshotCompanionCount = new Map<string, number>();
  for (const s of seats) {
    if (s.source === "companion") {
      snapshotCompanionCount.set(s.party_key, (snapshotCompanionCount.get(s.party_key) || 0) + 1);
    }
  }

  // Resolver SeatOccupant por mesa
  const tablesWithSeats = tables.map((t) => {
    const tableSeats = seatsByTable.get(t.id) || [];
    const resolved = tableSeats.map((s) => {
      const lead = s.guest_id ? guestsById.get(s.guest_id) : null;
      const liveCount = lead ? (companionsByGuest.get(lead.id)?.length || 0) : 0;
      const snapshotCount = snapshotCompanionCount.get(s.party_key) || 0;
      const drift = lead ? liveCount !== snapshotCount : false;
      return {
        ...s,
        guest_email: lead?.email ?? null,
        guest_side: lead?.side ?? null,
        live_companion_count: liveCount,
        drift_suggested: drift,
      };
    });
    return { ...t, seats: resolved };
  });

  // Pool: invitados confirmados + companions + flags
  const pool = confirmedGuests.map((g) => {
    const liveCompanions = companionsByGuest.get(g.id) || [];
    const leadSeated = seatsByGuestId.has(g.id);
    return {
      guest: g,
      companions: liveCompanions,
      lead_seated: leadSeated,
      seated_snapshot_count: snapshotCompanionCount.get(g.id) || 0,
    };
  });

  // Stats
  let totalSeats = 0;
  for (const t of tables) totalSeats += t.capacity;
  const occupied = seats.length;
  const seatedLeadCount = seats.filter((s) => s.source === "rsvp").length;
  const unseatedConfirmed = Math.max(0, confirmedGuests.length - seatedLeadCount);

  return NextResponse.json({
    ok: true,
    tables: tablesWithSeats,
    pool,
    stats: {
      tables: tables.length,
      total_seats: totalSeats,
      occupied,
      unseated_confirmed: unseatedConfirmed,
    },
  });
}
