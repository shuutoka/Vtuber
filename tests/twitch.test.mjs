import test from "node:test";
import assert from "node:assert/strict";
import { collectTwitch, matchesVtuber } from "../scripts/lib/twitch.mjs";
import { Store } from "../assets/js/v2/core/store.mjs";
const raw = (login, tags = ["VTuber"], language = "fr", viewers = 20) => ({
  id: login,
  user_login: login,
  user_name: login,
  title: "Un live",
  game_name: "Art",
  game_id: "1",
  viewer_count: viewers,
  language,
  tags,
  thumbnail_url: "https://example.org/{width}x{height}.jpg",
  started_at: "2026-09-30T20:00:00Z",
});
const response = (data) => ({ ok: true, json: async () => data });
function api() {
  const calls = [];
  return {
    calls,
    fetcher: async (url) => {
      const u = new URL(url);
      calls.push(u);
      if (u.pathname.endsWith("/token"))
        return response({ access_token: "PRIVATE_TOKEN" });
      if (u.pathname.endsWith("/users"))
        return response({
          data: u.searchParams
            .getAll("login")
            .map((login) => ({
              id: login,
              login,
              display_name: login,
              profile_image_url: `https://example.org/${login}.png`,
              description: "Bio",
            })),
        });
      if (u.searchParams.has("user_login"))
        return response({ data: [raw("spotlight")] });
      if (u.searchParams.has("after"))
        return response({
          data: [
            raw("new-vt", ["VTuber"], "fr", 22),
            raw("new-png", ["PNG Tuber"]),
          ],
          pagination: {},
        });
      return response({
        data: [
          raw("new-vt"),
          raw("not-vt", ["Gaming"]),
          raw("english-vt", ["VTuber"], "en"),
        ],
        pagination: { cursor: "next" },
      });
    },
  };
}
const input = {
  clientId: "CLIENT",
  secret: "SECRET",
  spotlight: [{ login: "spotlight" }],
  config: { language: "fr", tags: ["vtuber", "pngtuber"], maxPages: 10 },
};
test("tag recognition is explicit and normalizes case/spacing", () => {
  assert.equal(matchesVtuber(raw("x", ["V Tuber"]), ["vtuber"]), true);
  assert.equal(matchesVtuber(raw("x", ["Gaming"]), ["vtuber"]), false);
});
test("discovers new French channels over pagination, independent of Spotlight", async () => {
  const mock = api(),
    data = await collectTwitch({ ...input, fetcher: mock.fetcher });
  assert.deepEqual(
    data.streams.map((s) => s.login),
    ["new-vt", "new-png"],
  );
  assert.equal(data.streams[0].viewers, 22);
  assert.equal(data.coverage.pages, 2);
  assert.equal(data.coverage.complete, true);
  assert.equal(data.coverage.scanned, 4);
  assert.equal(data.users["new-vt"].avatar, "https://example.org/new-vt.png");
  assert.equal(data.spotlightStreams[0].login, "spotlight");
  assert.equal(JSON.stringify(data).includes("PRIVATE_TOKEN"), false);
  assert.equal(JSON.stringify(data).includes("SECRET"), false);
});
test("a scan cap reports partial coverage", async () => {
  const mock = api(),
    data = await collectTwitch({
      ...input,
      config: { ...input.config, maxPages: 1 },
      fetcher: mock.fetcher,
    });
  assert.equal(data.coverage.complete, false);
  assert.equal(data.coverage.pages, 1);
});
test("authorization failure rejects instead of creating false offline data", async () => {
  await assert.rejects(
    collectTwitch({
      ...input,
      fetcher: async () => ({ ok: false, status: 401 }),
    }),
    /HTTP 401/,
  );
});
test("expired snapshots remove live and raid candidates but keep public portraits", () => {
  const store = new Store();
  store.spotlight = [{ login: "spotlight", name: "Spotlight" }];
  store.snapshot = {
    version: 2,
    status: "ok",
    updatedAt: new Date(Date.now() - 50 * 60000).toISOString(),
    streams: [{ login: "new-vt" }],
    spotlightStreams: [{ login: "spotlight" }],
    users: { spotlight: { avatar: "https://example.org/a.png" } },
  };
  assert.equal(store.fresh, false);
  assert.equal(store.streams.length, 0);
  assert.equal(store.person("spotlight").status, "unknown");
  assert.equal(store.person("spotlight").avatar, "https://example.org/a.png");
});

test('Spotlight display names follow public Twitch metadata with an editorial fallback',()=>{
 const store=new Store();
 assert.equal(store.person('ryllaka').name,'Ryllaka');
 store.snapshot.users={ryllaka:{displayName:'Nom Twitch actualisé'}};
 assert.equal(store.person('ryllaka').name,'Nom Twitch actualisé');
});
