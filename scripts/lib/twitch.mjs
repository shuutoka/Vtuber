export const normalizeTag = (value) =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export function matchesVtuber(stream, tags) {
  const allowed = new Set(tags.map(normalizeTag));
  return (stream.tags || []).some((tag) => allowed.has(normalizeTag(tag)));
}
export function mapStream(stream) {
  return {
    id: stream.id,
    login: stream.user_login.toLowerCase(),
    name: stream.user_name,
    title: stream.title,
    category: stream.game_name,
    categoryId: stream.game_id,
    viewers: stream.viewer_count,
    language: stream.language,
    tags: stream.tags || [],
    thumbnail: stream.thumbnail_url
      .replace("{width}", "640")
      .replace("{height}", "360"),
    startedAt: stream.started_at,
  };
}

export async function collectTwitch({
  clientId,
  secret,
  spotlight,
  config,
  fetcher = fetch,
}) {
  async function request(url, options = {}) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetcher(url, {
        ...options,
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) return response.json();
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
        continue;
      }
      // Don't log tokens or query credentials.
      throw new Error(
        `Twitch HTTP ${response.status} sur ${new URL(url).pathname}`,
      );
    }
  }
  const token = await request("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      grant_type: "client_credentials",
    }),
  });
  const headers = {
    "Client-Id": clientId,
    Authorization: `Bearer ${token.access_token}`,
  };
  const discovered = new Map();
  const scanned = new Set();
  const seenCursors = new Set();
  let cursor = "",
    pages = 0,
    complete = false;
  // Get Streams has a language filter, but no tag filter. Scan all French pages,
  // deduplicate (streams can move between pages), then inspect explicit channel tags.
  do {
    const params = new URLSearchParams({
      language: config.language,
      type: "live",
      first: "100",
    });
    if (cursor) params.set("after", cursor);
    const page = await request(
      `https://api.twitch.tv/helix/streams?${params}`,
      { headers },
    );
    pages++;
    for (const stream of page.data) {
      scanned.add(stream.user_login.toLowerCase());
      if (
        stream.language === config.language &&
        matchesVtuber(stream, config.tags)
      )
        discovered.set(stream.user_login.toLowerCase(), mapStream(stream));
    }
    cursor = page.pagination?.cursor || "";
    if (!cursor) {
      complete = true;
      break;
    }
    if (seenCursors.has(cursor)) break;
    seenCursors.add(cursor);
  } while (pages < config.maxPages);
  const params = new URLSearchParams({ first: "100" });
  for (const person of spotlight) params.append("user_login", person.login);
  const spotlightResponse = await request(
    `https://api.twitch.tv/helix/streams?${params}`,
    { headers },
  );
  const spotlightStreams = spotlightResponse.data.map(mapStream);
  const logins = [
    ...new Set([...spotlight.map((p) => p.login), ...discovered.keys()]),
  ];
  const users = {};
  for (let offset = 0; offset < logins.length; offset += 100) {
    const query = new URLSearchParams();
    for (const login of logins.slice(offset, offset + 100))
      query.append("login", login);
    const response = await request(
      `https://api.twitch.tv/helix/users?${query}`,
      { headers },
    );
    for (const user of response.data)
      users[user.login.toLowerCase()] = {
        id: user.id,
        login: user.login,
        displayName: user.display_name,
        avatar: user.profile_image_url,
        description: user.description || "",
        offlineImage: user.offline_image_url || "",
      };
  }
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    status: "ok",
    streams: [...discovered.values()].sort((a, b) => b.viewers - a.viewers),
    spotlightStreams,
    users,
    coverage: {
      language: config.language,
      scanned: scanned.size,
      pages,
      complete,
      method: "declared-tags",
      tags: config.tags,
    },
  };
}
