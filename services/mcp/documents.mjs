import { startServer } from "./server.mjs";

// A separate entrypoint makes older releases fail closed on rollback.
await startServer({ profile: "documents" });
