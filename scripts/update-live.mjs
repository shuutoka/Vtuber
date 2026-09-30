import { readFile, writeFile, rename } from "node:fs/promises";
import { collectTwitch } from "./lib/twitch.mjs";
const clientId = process.env.TWITCH_CLIENT_ID;
const secret = process.env.TWITCH_CLIENT_SECRET;
if (!clientId || !secret) {
  console.log(
    "Synchronisation ignorée : secrets Twitch absents. Aucun instantané modifié.",
  );
  process.exit(0);
}
const root = new URL("../", import.meta.url);
const spotlight = JSON.parse(
  await readFile(new URL("data/spotlight.json", root), "utf8"),
);
const config = JSON.parse(
  await readFile(new URL("data/discovery-config.json", root), "utf8"),
);
const snapshot = await collectTwitch({ clientId, secret, spotlight, config });
// Replace only once all calls succeed. Errors preserve the previous valid data.
const target = new URL("data/live.json", root);
const temporary = new URL("data/live.json.tmp", root);
await writeFile(temporary, JSON.stringify(snapshot, null, 2) + "\n");
await rename(temporary, target);
console.log(
  `${snapshot.streams.length} VTubers découverts / ${snapshot.coverage.scanned} directs FR examinés. Parcours complet : ${snapshot.coverage.complete}.`,
);
