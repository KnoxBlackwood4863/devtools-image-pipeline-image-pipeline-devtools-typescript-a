import { z } from "zod";
import sharp from "sharp";
import { infrai } from "./infrai_client.js";

export const uploadRequest = z.object({
  image_base64: z.string().min(1),
  filename: z.string().regex(/^[a-zA-Z0-9._-]+$/),
  build_id: z.string().min(1)
});
export type UploadRequest = z.infer<typeof uploadRequest>;

export type Diagnostic = { level: "info" | "error"; message: string; build_id: string };
export type UploadResult = { key: string; width: number; height: number; diagnostics: Diagnostic[] };

const bucket = "devtools-images";
let bucketReady: Promise<unknown> | undefined;
function ensureBucket() { bucketReady ??= infrai.storage.bucket.create({ name: bucket }); return bucketReady; }

export async function resizeAndStore(input: UploadRequest): Promise<UploadResult> {
  const parsed = uploadRequest.parse(input);
  await ensureBucket();
  const source = Buffer.from(parsed.image_base64, "base64");
  const resized = await sharp(source).resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const key = `builds/${parsed.build_id}/${parsed.filename.replace(/\.[^.]+$/, "")}.webp`;
  const signed = await infrai.storage.object.presign(bucket, key, { op: "put", expires_seconds: 600, content_type: "image/webp", max_bytes: 8_000_000, idempotency_key: `${parsed.build_id}:${parsed.filename}` });
  const uploadBody = new Uint8Array(resized.data.byteLength);
  uploadBody.set(resized.data);
  const put = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": "image/webp" }, body: uploadBody });
  if (!put.ok) throw new Error(`upload failed with HTTP ${put.status}`);
  const diagnostics: Diagnostic[] = [{ level: "info", message: `resized ${resized.info.width}x${resized.info.height} for release`, build_id: parsed.build_id }];
  return { key, width: resized.info.width, height: resized.info.height, diagnostics };
}
