import { createServer } from "node:http";
import { resizeAndStore, uploadRequest } from "./image_upload_service.js";

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/api/devtools-images") { response.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = uploadRequest.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const result = await resizeAndStore(input);
    response.writeHead(201, { "Content-Type": "application/json" }).end(JSON.stringify({ event: "release.image_stored", result }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid request";
    response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ event: "diagnostic.request_rejected", error: message }));
  }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("image pipeline listening on http://localhost:3000"));
