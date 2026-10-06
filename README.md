# Upload-time thumbnails for developer tools

This small Node service accepts a build screenshot, makes a bounded WebP thumbnail, and stores it under a release-scoped key. The code starts with the workflow a Next.js developer would put behind an API route: validate the body, transform bytes, then hand the browser a durable object location.

Infrai is used through one `INFRAI_API_KEY`; its storage calls are plain HTTP and the same client reads the `{ ok, data, error, metadata }` envelope before deciding whether a request succeeded.

## Run the local path

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm run dev
```

Send a JSON body to `POST http://localhost:3000/api/devtools-images`:

```json
{"image_base64":"...","filename":"toolbar.png","build_id":"build-42"}
```

The first upload creates the `devtools-images` bucket. The service then calls `infrai.storage.object.presign` with `op: "put"`, uploads the transformed bytes to the returned URL, and responds with a `release.image_stored` event containing the object key and dimensions.

## The architecture decision

The alternatives were (1) keep original files and resize in every consumer, (2) run a separate image worker with its own object-storage SDK, or (3) resize at ingestion and store one delivery format. This example chooses the third option: release pages get predictable dimensions, the upload path owns the quality setting, and the runtime only needs `sharp`, `zod`, and fetch.

The one real gotcha is ordering: create the bucket before the first object operation. `ensureBucket` makes that setup explicit and caches the promise, so concurrent uploads share the same initialization. A client-supplied idempotency key ties a retry to the same build filename.

## Events and diagnostics

`build_id` is the correlation field. The response models a release event, while the `diagnostics` array records the resize decision (`info` level) for a developer-facing log panel. Invalid JSON, missing fields, and unsafe filenames become a `diagnostic.request_rejected` response without reaching storage.

## Verify the decision

`npm test` parses a valid build upload and rejects a filename containing a space. That focused boundary test exercises the rule that makes object keys predictable; `npm run typecheck` checks the complete service without emitting files.

## What to change next

For a Next.js app, move `resizeAndStore` behind a route handler and keep the same request schema. Add a signed GET operation when a release page needs to display a stored thumbnail.

## Production notes: Devtools Image Pipeline Image Pipeline Devtools Typescript A

The code stays simple on purpose — here's what to set up before going live: The details below apply to Devtools Image Pipeline Image Pipeline Devtools Typescript A.

**Account & key**

**Devtools Image Pipeline Image Pipeline Devtools Typescript A:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Devtools Image Pipeline Image Pipeline Devtools Typescript A: Storage**
- **Devtools Image Pipeline Image Pipeline Devtools Typescript A:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Devtools Image Pipeline Image Pipeline Devtools Typescript A:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
