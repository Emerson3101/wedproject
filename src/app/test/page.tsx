"use client";

import { useState } from "react";

type EnvStatus = {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  isSupabaseConfigured: boolean;
  isSupabaseServerConfigured: boolean;
};

type GuestRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
};

type CheckResult = {
  ok: boolean;
  env?: EnvStatus;
  guestCount?: number;
  recentGuests?: GuestRow[];
  error?: string;
  hint?: string;
};

type InsertResult = {
  ok: boolean;
  directInsert?: GuestRow;
  rpc?: { ok: boolean; guestId?: string; email?: string; error?: string };
  error?: string;
  hint?: string;
  method?: string;
};

/* ---- Cloudinary test types ---- */

type CloudinaryEnvStatus = {
  cloudName: string;
  uploadPreset: string;
  hasCloudName: boolean;
  hasUploadPreset: boolean;
};

type CloudinaryCheckResult = {
  ok: boolean;
  env?: CloudinaryEnvStatus;
  apiUrl?: string;
  error?: string;
};

type CloudinaryUploadResult = {
  ok: boolean;
  publicId?: string;
  secureUrl?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  error?: string;
  hint?: string;
  status?: number;
  message?: string;
};

export default function TestPage() {
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [insertResult, setInsertResult] = useState<InsertResult | null>(null);
  const [cloudCheckResult, setCloudCheckResult] = useState<CloudinaryCheckResult | null>(null);
  const [cloudUploadResult, setCloudUploadResult] = useState<CloudinaryUploadResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function runCheck() {
    setLoading("check");
    setInsertResult(null);
    try {
      const res = await fetch("/api/test/guest");
      setCheckResult((await res.json()) as CheckResult);
    } catch (err) {
      setCheckResult({
        ok: false,
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setLoading(null);
    }
  }

  async function runInsert() {
    setLoading("insert");
    setInsertResult(null);
    try {
      const res = await fetch("/api/test/guest", { method: "POST" });
      setInsertResult((await res.json()) as InsertResult);
      await runCheck();
    } catch (err) {
      setInsertResult({
        ok: false,
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setLoading(null);
    }
  }

  async function runCleanup() {
    setLoading("cleanup");
    try {
      const res = await fetch("/api/test/guest", { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; message?: string; error?: string };
      setInsertResult(
        data.ok
          ? { ok: true, directInsert: undefined }
          : { ok: false, error: data.error }
      );
      await runCheck();
    } catch (err) {
      setInsertResult({
        ok: false,
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setLoading(null);
    }
  }

  /* ---- Cloudinary test handlers ---- */

  async function runCloudCheck() {
    setLoading("cloudCheck");
    setCloudUploadResult(null);
    try {
      const res = await fetch("/api/test/cloudinary");
      setCloudCheckResult((await res.json()) as CloudinaryCheckResult);
    } catch (err) {
      setCloudCheckResult({
        ok: false,
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setLoading(null);
    }
  }

  async function runCloudUpload() {
    setLoading("cloudUpload");
    setCloudUploadResult(null);
    try {
      const res = await fetch("/api/test/cloudinary", { method: "POST" });
      setCloudUploadResult((await res.json()) as CloudinaryUploadResult);
    } catch (err) {
      setCloudUploadResult({
        ok: false,
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setLoading(null);
    }
  }

  async function runCloudCleanup() {
    setLoading("cloudCleanup");
    setCloudUploadResult(null);
    try {
      const res = await fetch("/api/test/cloudinary", { method: "DELETE" });
      setCloudUploadResult((await res.json()) as CloudinaryUploadResult);
    } catch (err) {
      setCloudUploadResult({
        ok: false,
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setLoading(null);
      await runCloudCheck();
    }
  }

  return (
    <div className="min-h-screen bg-ivory p-6 md:p-10 font-sans text-burgundy">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-serif mb-2">Test Suite</h1>
          <p className="text-burgundy/60 text-sm">
            Uses <code className="bg-champagne/50 px-1 rounded">.env.local</code> via API routes.
            Open at{" "}
            <a href="/test" className="underline">
              /test
            </a>
          </p>
        </div>

        {/* ---- Supabase section ---- */}
        <section className="rounded-2xl border border-champagne bg-white/40 p-5 space-y-4">
          <h2 className="text-xl font-serif text-burgundy">Supabase Guest Test</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runCheck}
              disabled={loading !== null}
              className="px-4 py-2 rounded-xl bg-burgundy text-ivory text-sm disabled:opacity-50"
            >
              {loading === "check" ? "Checking…" : "1. Check connection"}
            </button>
            <button
              onClick={runInsert}
              disabled={loading !== null}
              className="px-4 py-2 rounded-xl bg-sage text-ivory text-sm disabled:opacity-50"
            >
              {loading === "insert" ? "Inserting…" : "2. Insert test guest"}
            </button>
            <button
              onClick={runCleanup}
              disabled={loading !== null}
              className="px-4 py-2 rounded-xl border border-burgundy/30 text-sm disabled:opacity-50"
            >
              {loading === "cleanup" ? "Cleaning…" : "3. Delete test guests"}
            </button>
          </div>

          {/* Supabase check result */}
          {checkResult && (
            <div className="rounded-2xl border border-champagne bg-white/60 p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    checkResult.ok ? "bg-sage" : "bg-rose"
                  }`}
                />
                Connection check
              </h3>

              {checkResult.env && (
                <table className="w-full text-sm">
                  <tbody>
                    <EnvRow label="NEXT_PUBLIC_SUPABASE_URL" ok={checkResult.env.hasUrl} value={checkResult.env.supabaseUrl} />
                    <EnvRow label="NEXT_PUBLIC_SUPABASE_ANON_KEY" ok={checkResult.env.hasAnonKey} value={checkResult.env.anonKey} />
                    <EnvRow label="SUPABASE_SERVICE_ROLE_KEY" ok={checkResult.env.hasServiceRoleKey} value={checkResult.env.serviceRoleKey} />
                    <EnvRow label="Server ready" ok={checkResult.env.isSupabaseServerConfigured} value={checkResult.env.isSupabaseServerConfigured ? "yes" : "no"} />
                  </tbody>
                </table>
              )}

              {checkResult.ok && (
                <p className="text-sm text-sage">
                  Connected. <strong>{checkResult.guestCount}</strong> guest(s) in table.
                </p>
              )}

              {checkResult.error && (
                <p className="text-sm text-rose bg-rose/10 p-3 rounded-xl">
                  {checkResult.error}
                  {checkResult.hint && (
                    <>
                      <br />
                      <span className="text-burgundy/70">{checkResult.hint}</span>
                    </>
                  )}
                </p>
              )}

              {checkResult.recentGuests && checkResult.recentGuests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent guests</h3>
                  <ul className="text-xs space-y-1 font-mono">
                    {checkResult.recentGuests.map((g) => (
                      <li key={g.id} className="text-burgundy/80">
                        {g.name} — {g.email} — {g.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Supabase insert result */}
          {insertResult && (
            <div className="rounded-2xl border border-champagne bg-white/60 p-4 space-y-3">
              <h3 className="font-semibold">Insert test</h3>
              {insertResult.ok ? (
                <div className="text-sm text-sage space-y-2">
                  {insertResult.directInsert && (
                    <p>
                      Direct insert OK: <code>{insertResult.directInsert.email}</code>
                    </p>
                  )}
                  {insertResult.rpc?.ok && (
                    <p>
                      RPC insert OK: <code>{insertResult.rpc.email}</code> (id:{" "}
                      {insertResult.rpc.guestId})
                    </p>
                  )}
                  {insertResult.rpc && !insertResult.rpc.ok && (
                    <p className="text-rose">
                      RPC failed: {insertResult.rpc.error}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-rose bg-rose/10 p-3 rounded-xl">
                  {insertResult.error}
                  {insertResult.hint && (
                    <>
                      <br />
                      <span className="text-burgundy/70">{insertResult.hint}</span>
                    </>
                  )}
                </p>
              )}
            </div>
          )}
        </section>

        {/* ---- Cloudinary section ---- */}
        <section className="rounded-2xl border border-champagne bg-white/40 p-5 space-y-4">
          <h2 className="text-xl font-serif text-burgundy">Cloudinary Upload Test</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runCloudCheck}
              disabled={loading !== null}
              className="px-4 py-2 rounded-xl bg-gold text-ivory text-sm disabled:opacity-50"
            >
              {loading === "cloudCheck" ? "Checking…" : "1. Check config"}
            </button>
            <button
              onClick={runCloudUpload}
              disabled={loading !== null}
              className="px-4 py-2 rounded-xl bg-sage text-ivory text-sm disabled:opacity-50"
            >
              {loading === "cloudUpload" ? "Uploading…" : "2. Upload test image"}
            </button>
            <button
              onClick={runCloudCleanup}
              disabled={loading !== null}
              className="px-4 py-2 rounded-xl border border-burgundy/30 text-sm disabled:opacity-50"
            >
              {loading === "cloudCleanup" ? "Cleaning…" : "3. Cleanup info"}
            </button>
          </div>

          {/* Cloud config check result */}
          {cloudCheckResult && (
            <div className="rounded-2xl border border-champagne bg-white/60 p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    cloudCheckResult.ok ? "bg-sage" : "bg-rose"
                  }`}
                />
                Config check
              </h3>

              {cloudCheckResult.env && (
                <table className="w-full text-sm">
                  <tbody>
                    <EnvRow label="NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" ok={cloudCheckResult.env.hasCloudName} value={cloudCheckResult.env.cloudName} />
                    <EnvRow label="NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET" ok={cloudCheckResult.env.hasUploadPreset} value={cloudCheckResult.env.uploadPreset} />
                  </tbody>
                </table>
              )}

              {cloudCheckResult.ok && cloudCheckResult.apiUrl && (
                <p className="text-sm text-sage">
                  Configured. API endpoint: <code className="bg-champagne/50 px-1 rounded">{cloudCheckResult.apiUrl}</code>
                </p>
              )}

              {cloudCheckResult.error && (
                <p className="text-sm text-rose bg-rose/10 p-3 rounded-xl">
                  {cloudCheckResult.error}
                </p>
              )}
            </div>
          )}

          {/* Cloud upload result */}
          {cloudUploadResult && (
            <div className="rounded-2xl border border-champagne bg-white/60 p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    cloudUploadResult.ok ? "bg-sage" : "bg-rose"
                  }`}
                />
                Upload test
              </h3>

              {cloudUploadResult.ok ? (
                <div className="text-sm space-y-2">
                  <p className="text-sage">✓ Upload successful!</p>
                  {cloudUploadResult.publicId && (
                    <p>
                      <strong>public_id:</strong>{" "}
                      <code className="bg-champagne/50 px-1 rounded">{cloudUploadResult.publicId}</code>
                    </p>
                  )}
                  {cloudUploadResult.secureUrl && (
                    <p>
                      <strong>URL:</strong>{" "}
                      <a
                        href={cloudUploadResult.secureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-burgundy"
                      >
                        {cloudUploadResult.secureUrl}
                      </a>
                    </p>
                  )}
                  {cloudUploadResult.format && cloudUploadResult.bytes && (
                    <p>
                      <strong>Details:</strong> {cloudUploadResult.format},{" "}
                      {cloudUploadResult.bytes} bytes, {cloudUploadResult.width}×{cloudUploadResult.height}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-rose bg-rose/10 p-3 rounded-xl">
                  {cloudUploadResult.error}
                  {cloudUploadResult.hint && (
                    <>
                      <br />
                      <span className="text-burgundy/70">{cloudUploadResult.hint}</span>
                    </>
                  )}
                </p>
              )}

              {cloudUploadResult.message && (
                <p className="text-sm text-burgundy/60 italic">{cloudUploadResult.message}</p>
              )}
            </div>
          )}
        </section>

        <section className="text-xs text-burgundy/50 space-y-1">
          <p>
            <strong>Expected .env.local:</strong>
          </p>
          <pre className="bg-champagne/30 p-3 rounded-xl overflow-x-auto">
{`# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=unsigned_preset

# Google Photos
NEXT_PUBLIC_GOOGLE_PHOTOS_ALBUM_URL=https://photos.google.com/share/...`}
          </pre>
          <p>Restart <code>npm run dev</code> after editing .env.local.</p>
        </section>
      </div>
    </div>
  );
}

function EnvRow({
  label,
  ok,
  value,
}: {
  label: string;
  ok: boolean;
  value: string;
}) {
  return (
    <tr className="border-b border-champagne/40">
      <td className="py-2 pr-4 font-mono text-xs">{label}</td>
      <td className="py-2 pr-2">
        <span className={ok ? "text-sage" : "text-rose"}>{ok ? "✓" : "✗"}</span>
      </td>
      <td className="py-2 text-xs text-burgundy/60">{value}</td>
    </tr>
  );
}
