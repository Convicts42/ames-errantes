import { listAnimals } from "../../../server/repository.mjs";
import { endpoint, json } from "../../../server/http";
export const runtime = "nodejs";
export const GET = endpoint(() => json({ animals: listAnimals() }));
