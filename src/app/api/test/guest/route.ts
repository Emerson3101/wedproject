import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import {
  supabaseConfig,
  isSupabaseConfigured,
  isSupabaseServerConfigured,
} from "@/lib/config";

function maskUrl(url: string) {
  if (!url) return "(not set)";
  try {
    const parsed = new URL(url);
    const ref = parsed.hostname.split(".")[0];
    return `${parsed.protocol}//${ref.slice(0, 4)}…${ref.slice(-4)}.supabase.co`;
  } catch {
    return "(invalid URL)";
  }
}

function maskKey(key: string) {
  if (!key) return "(not set)";
  if (key.length < 12) return "••••••••";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

/* GET — diagnostics + read guests */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not Found", { status: 404 });
  }
  const env = {
    supabaseUrl: maskUrl(supabaseConfig.url),
    anonKey: maskKey(supabaseConfig.anonKey),
    serviceRoleKey: maskKey(supabaseConfig.serviceRoleKey),
    hasUrl: supabaseConfig.url !== "",
    hasAnonKey: supabaseConfig.anonKey !== "",
    hasServiceRoleKey: supabaseConfig.serviceRoleKey !== "",
    isSupabaseConfigured,
    isSupabaseServerConfigured,
  };

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({
      ok: false,
      env,
      error:
        "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    });
  }

  const supabase = createSupabaseServerClient()!;

  const { count, error: countError } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({
      ok: false,
      env,
      error: countError.message,
      hint:
        countError.message.includes("relation") ||
        countError.message.includes("does not exist")
          ? "Run supabase/schema.sql in the Supabase SQL Editor."
          : "Check your Supabase URL and service role key.",
    });
  }

  const { data: guests, error: listError } = await supabase
    .from("guests")
    .select("id, name, email, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (listError) {
    return NextResponse.json({
      ok: false,
      env,
      error: listError.message,
    });
  }

  return NextResponse.json({
    ok: true,
    env,
    guestCount: count ?? 0,
    recentGuests: guests ?? [],
  });
}

/* POST — insert a test guest */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not Found", { status: 404 });
  }
  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase server not configured. Check .env.local",
      },
      { status: 503 }
    );
  }

  const supabase = createSupabaseServerClient()!;
  const timestamp = Date.now();
  const testGuest = {
    name: `Test Guest ${timestamp}`,
    email: `test-${timestamp}@test.local`,
    status: "confirmed" as const,
    num_companions: 0,
    message: "Inserted from /test page",
  };

  // Test 1: direct insert
  const { data: inserted, error: insertError } = await supabase
    .from("guests")
    .insert(testGuest)
    .select("id, name, email, status, created_at")
    .single();

  if (insertError) {
    return NextResponse.json(
      {
        ok: false,
        method: "direct_insert",
        error: insertError.message,
        hint:
          insertError.message.includes("relation") ||
          insertError.message.includes("does not exist")
            ? "Run supabase/schema.sql in the Supabase SQL Editor."
            : undefined,
      },
      { status: 500 }
    );
  }

  // Test 2: submit_rsvp RPC (same path as real RSVP form)
  const rpcEmail = `rpc-test-${timestamp}@test.local`;
  const { data: rpcId, error: rpcError } = await supabase.rpc("submit_rsvp", {
    p_name: `RPC Test Guest ${timestamp}`,
    p_email: rpcEmail,
    p_phone: null,
    p_status: "confirmed",
    p_num_companions: 1,
    p_dietary: null,
    p_message: "Inserted via submit_rsvp RPC",
    p_side: null,
    p_companions: [{ name: "Test Companion", dietary_restrictions: null }],
  });

  return NextResponse.json({
    ok: true,
    directInsert: inserted,
    rpc: rpcError
      ? { ok: false, error: rpcError.message }
      : { ok: true, guestId: rpcId, email: rpcEmail },
  });
}

/* DELETE — remove test guests */
export async function DELETE() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not Found", { status: 404 });
  }
  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase server not configured." },
      { status: 503 }
    );
  }

  const supabase = createSupabaseServerClient()!;

  const { error } = await supabase
    .from("guests")
    .delete()
    .like("email", "%@test.local");

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Deleted all guests with @test.local emails.",
  });
}
