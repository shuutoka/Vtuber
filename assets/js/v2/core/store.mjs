const fallbackSpotlight = [
  { login: "ryllaka", name: "Ryllaka", color: "#ef8fae" },
  { login: "lulufaevt", name: "LuluFaeVT", color: "#88ddd6" },
  { login: "yuann_art", name: "Yuann_art", color: "#c3adf5" },
  { login: "nixy_vt", name: "Nixy_vt", color: "#f1c47c" },
];
export class Store {
  constructor() {
    this.spotlight = fallbackSpotlight;
    this.snapshot = { streams: [], spotlightStreams: [], users: {} };
    this.events = [];
    this.config = { maxAgeMinutes: 45 };
    this.errors = [];
  }
  async load() {
    const paths = [
      "data/spotlight.json",
      "data/live.json",
      "data/events.json",
      "data/discovery-config.json",
    ];
    const results = await Promise.allSettled(
      paths.map(async (path) => {
        const r = await fetch(path, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) throw Error(path);
        return r.json();
      }),
    );
    this.errors = [];
    const keys = ["spotlight", "snapshot", "events", "config"];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") this[keys[i]] = r.value;
      else this.errors.push(keys[i]);
    });
    // A failed live refresh must not keep claiming current status.
    if (this.errors.includes("snapshot"))
      this.snapshot = {
        streams: [],
        spotlightStreams: [],
        users: this.snapshot.users || {},
        status: "unavailable",
      };
    return this;
  }
  get fresh() {
    const age = Date.now() - Date.parse(this.snapshot.updatedAt);
    return (
      ["ok", "bootstrap"].includes(this.snapshot.status) &&
      age >= 0 &&
      age < this.config.maxAgeMinutes * 60000
    );
  }
  get ready() {
    return (
      this.fresh &&
      this.snapshot.version === 2 &&
      !this.snapshot.coverage?.pending
    );
  }
  get streams() {
    return this.ready ? this.snapshot.streams || [] : [];
  }
  person(login) {
    const editorial = this.spotlight.find((p) => p.login === login);
    const user = this.snapshot.users?.[login] || {};
    const stream = this.fresh
      ? [...(this.snapshot.spotlightStreams || []), ...this.streams].find(
          (s) => s.login === login,
        )
      : null;
    return {
      ...editorial,
      ...user,
      login,
      name: user.displayName || editorial?.name || stream?.name || login,
      color: editorial?.color || "#b9a7ef",
      stream,
      status: !this.fresh ? "unknown" : stream ? "live" : "offline",
      spotlight: !!editorial,
    };
  }
  get featured() {
    return this.spotlight.map((p) => this.person(p.login));
  }
}
