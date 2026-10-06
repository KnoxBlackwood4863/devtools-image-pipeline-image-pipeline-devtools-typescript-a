import assert from "node:assert/strict";
import { uploadRequest } from "../src/image_upload_service.js";

const valid = uploadRequest.parse({ image_base64: "aGVsbG8=", filename: "screen.png", build_id: "build-42" });
assert.equal(valid.filename, "screen.png");
assert.throws(() => uploadRequest.parse({ image_base64: "aGVsbG8=", filename: "screen space.png", build_id: "build-42" }));
console.log("request boundary accepts a build image and rejects unsafe filenames");
