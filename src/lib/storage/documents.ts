// src/lib/storage/documents.ts — patient-document storage (Neon Object Storage).
//
// Neon Object Storage is S3-compatible and branch-scoped; the `uploads` bucket
// is declared in neon.ts and its credentials arrive as the standard AWS_*
// env vars (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3,
// AWS_REGION). Path-style addressing is REQUIRED by Neon, so forcePathStyle.
//
// The <orgId>/<patientId>/<object> path convention is unchanged from
// migrations 0008/0018; access is enforced in app code (assertDocumentPath +
// workspace resolution) — the object store only mints time-boxed URLs.
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3: S3Client | undefined;

function getS3(): S3Client {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!endpoint) {
    throw new Error("AWS_ENDPOINT_URL_S3 is not set (Neon Object Storage; run `neon env pull`).");
  }
  s3 ??= new S3Client({
    region: process.env.AWS_REGION ?? "us-east-2",
    endpoint,
    forcePathStyle: true,
  });
  return s3;
}

/** The bucket declared in neon.ts. */
const DOCUMENT_BUCKET = "uploads";

/** Path guard: the object must live under the caller's org + patient. */
export function assertDocumentPath(path: string, orgId: string, patientId: string): void {
  if (!path.startsWith(`${orgId}/${patientId}/`)) throw new Error("document_path_forbidden");
}

/** Short-lived read URL for the clinician's reference of record (§11). */
export async function signedDocumentUrl(path: string, expiresInSeconds = 300): Promise<string> {
  return getSignedUrl(
    getS3(),
    new GetObjectCommand({ Bucket: DOCUMENT_BUCKET, Key: path }),
    { expiresIn: expiresInSeconds },
  );
}

/** Direct-to-storage upload URL; the OCR intake row is still created server-side. */
export async function signedUploadUrl(
  path: string,
  contentType: string,
  expiresInSeconds = 300,
): Promise<string> {
  return getSignedUrl(
    getS3(),
    new PutObjectCommand({ Bucket: DOCUMENT_BUCKET, Key: path, ContentType: contentType }),
    { expiresIn: expiresInSeconds },
  );
}

/** Server-side upload (small files already read into memory by a route). */
export async function uploadDocument(
  path: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  await getS3().send(
    new PutObjectCommand({ Bucket: DOCUMENT_BUCKET, Key: path, Body: body, ContentType: contentType }),
  );
}
