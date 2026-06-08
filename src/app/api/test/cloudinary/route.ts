import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConfig } from "@/lib/config";

/* Helper to mask sensitive values */
function mask(value: string) {
  if (!value) return "(not set)";
  if (value.length < 8) return "••••••••";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

/* GET — diagnostics: are Cloudinary env vars configured? */
export async function GET() {
  const hasCloudName = cloudinaryConfig.cloudName !== "";
  const hasUploadPreset = cloudinaryConfig.uploadPreset !== "";

  if (!hasCloudName || !hasUploadPreset) {
    return NextResponse.json({
      ok: false,
      env: {
        cloudName: mask(cloudinaryConfig.cloudName),
        uploadPreset: mask(cloudinaryConfig.uploadPreset),
        hasCloudName,
        hasUploadPreset,
      },
      error:
        "Missing Cloudinary env vars. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local",
    });
  }

  /* Optional: ping Cloudinary by fetching an unsigned upload signature */
  const apiUrl = `https://${cloudinaryConfig.cloudName}.cloudinary.com`;

  return NextResponse.json({
    ok: true,
    env: {
      cloudName: mask(cloudinaryConfig.cloudName),
      uploadPreset: mask(cloudinaryConfig.uploadPreset),
      hasCloudName,
      hasUploadPreset,
    },
    apiUrl,
  });
}

/* POST — upload a small test image to Cloudinary */
export async function POST(_request: NextRequest) {
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
    return NextResponse.json(
      { ok: false, error: "Cloudinary not configured. Check .env.local" },
      { status: 503 }
    );
  }

  const timestamp = Date.now();
  const publicId = `wedding-test-${timestamp}`;

  /* Create a tiny 1x1 PNG (transparent) as a FormData payload */
  const formData = new FormData();
  formData.append("file", createTestImage(), `test-${timestamp}.png`);
  formData.append("upload_preset", cloudinaryConfig.uploadPreset);
  formData.append("folder", "wedding-guest-photos");
  formData.append("public_id", publicId);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    /* Safely parse response — Cloudinary may return HTML on network/auth errors */
    const contentType = res.headers.get("content-type") || "";
    let data: Record<string, any> = {};
    if (contentType.includes("json")) {
      data = (await res.json()) as Record<string, any>;
    } else {
      const text = await res.text();
      throw new Error(`Cloudinary returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
    }

    if (!res.ok || data.error) {
      return NextResponse.json(
        {
          ok: false,
          error: data.error?.message || `Cloudinary returned HTTP ${res.status}`,
          hint: data.error?.message?.includes("preset")
            ? "Check that your upload preset exists and is set to 'unsigned' in Cloudinary dashboard."
            : undefined,
          status: res.status,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      publicId: data.public_id,
      secureUrl: data.secure_url,
      format: data.format,
      bytes: data.bytes,
      width: data.width,
      height: data.height,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown fetch error",
        hint: "Check network connectivity and Cloudinary credentials.",
      },
      { status: 500 }
    );
  }
}

/* DELETE — remove the test image from Cloudinary */
export async function DELETE() {
  /* Cloudinary unsigned uploads cannot be deleted without an API secret
     (which we don't store client-safe). Instead we return a message
     telling the user to clean up manually or note that the test image
     is tiny and harmless. */
  return NextResponse.json({
    ok: true,
    message:
      "Test image retained (unsigned uploads can't be deleted server-side without the API secret). The 1×1 test PNG is negligible in size.",
    hint: `Delete manually at https://${cloudinaryConfig.cloudName}.cloudinary.com/console/media_library if needed.`,
  });
}

/* Generate a tiny 1×1 transparent PNG as a Blob */
function createTestImage(): Blob {
  // Minimal 1x1 transparent PNG (base64 decoded)
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "image/png" });
}
