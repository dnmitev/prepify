import { buildServer } from "./server.js";

const env = process.env;
const port = Number(env["PORT"] ?? "4000");

const app = await buildServer();
await app.listen({ port, host: "0.0.0.0" });
