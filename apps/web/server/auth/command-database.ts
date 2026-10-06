import "server-only";
import { createCommandClient } from "@cadence/database/command-transaction";
import { AccessError } from "@cadence/contracts/access-errors";

let database: ReturnType<typeof createCommandClient> | undefined;
export function commandDatabase(): ReturnType<typeof createCommandClient> {
  if (!database) {
    const connectionString = process.env.CADENCE_COMMAND_DATABASE_URL;
    if (!connectionString) throw new AccessError("SERVICE_UNAVAILABLE");
    database = createCommandClient(connectionString);
  }
  return database;
}
