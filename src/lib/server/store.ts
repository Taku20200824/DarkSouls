import "server-only";
import fs from "node:fs";
import path from "node:path";
import { dataDir, env, firebaseConfigured, isDesktopApp, isProduction } from "./env";

/**
 * Minimal document store used by the app. Backed by Firestore (Admin SDK) in
 * deployment. When Firebase is not configured and NODE_ENV != production, a local
 * JSON file is used so the app can be developed offline; this is reported in the UI
 * ("DEV STORE") and is never used in production.
 */
export interface ListOpts {
  orderBy?: string;
  desc?: boolean;
  limit?: number;
}
export interface Store {
  kind: "firestore" | "dev-file";
  get<T>(docPath: string): Promise<T | null>;
  set(docPath: string, data: object, merge?: boolean): Promise<void>;
  /** Create only if absent; returns false when the doc already existed. */
  create(docPath: string, data: object): Promise<boolean>;
  add(collectionPath: string, data: object): Promise<string>;
  list<T>(collectionPath: string, opts?: ListOpts): Promise<(T & { id: string })[]>;
  delete(docPath: string): Promise<void>;
}

class FirestoreStore implements Store {
  kind = "firestore" as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dbPromise: Promise<any>;
  constructor() {
    this.dbPromise = (async () => {
      const { initializeApp, getApps, cert } = await import("firebase-admin/app");
      const { getFirestore } = await import("firebase-admin/firestore");
      const app =
        getApps()[0] ??
        initializeApp({
          credential: cert({
            projectId: env("FIREBASE_PROJECT_ID"),
            clientEmail: env("FIREBASE_CLIENT_EMAIL"),
            privateKey: env("FIREBASE_PRIVATE_KEY")!.replace(/\\n/g, "\n"),
          }),
        });
      const db = getFirestore(app);
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch {
        /* settings can only be called once per instance */
      }
      return db;
    })();
  }
  async get<T>(p: string) {
    const snap = await (await this.dbPromise).doc(p).get();
    return snap.exists ? (snap.data() as T) : null;
  }
  async set(p: string, data: object, merge = false) {
    await (await this.dbPromise).doc(p).set(data, { merge });
  }
  async create(p: string, data: object) {
    try {
      await (await this.dbPromise).doc(p).create(data);
      return true;
    } catch (e: unknown) {
      if ((e as { code?: number }).code === 6) return false; // ALREADY_EXISTS
      throw e;
    }
  }
  async add(c: string, data: object) {
    const ref = await (await this.dbPromise).collection(c).add(data);
    return ref.id as string;
  }
  async list<T>(c: string, o: ListOpts = {}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = (await this.dbPromise).collection(c);
    if (o.orderBy) q = q.orderBy(o.orderBy, o.desc ? "desc" : "asc");
    if (o.limit) q = q.limit(o.limit);
    const snap = await q.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as T) }));
  }
  async delete(p: string) {
    await (await this.dbPromise).doc(p).delete();
  }
}

class DevFileStore implements Store {
  kind = "dev-file" as const;
  private file = path.join(dataDir(), ".dev-store.json");
  private read(): Record<string, object> {
    try {
      return JSON.parse(fs.readFileSync(this.file, "utf8"));
    } catch {
      return {};
    }
  }
  private write(d: Record<string, object>) {
    fs.writeFileSync(this.file, JSON.stringify(d));
  }
  async get<T>(p: string) {
    return (this.read()[p] as T) ?? null;
  }
  async set(p: string, data: object, merge = false) {
    const d = this.read();
    d[p] = merge ? { ...(d[p] ?? {}), ...data } : data;
    this.write(d);
  }
  async create(p: string, data: object) {
    const d = this.read();
    if (d[p]) return false;
    d[p] = data;
    this.write(d);
    return true;
  }
  async add(c: string, data: object) {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    await this.set(`${c}/${id}`, data);
    return id;
  }
  async list<T>(c: string, o: ListOpts = {}) {
    const d = this.read();
    const prefix = `${c}/`;
    let rows = Object.entries(d)
      .filter(([k]) => k.startsWith(prefix) && !k.slice(prefix.length).includes("/"))
      .map(([k, v]) => ({ id: k.slice(prefix.length), ...(v as T) }));
    if (o.orderBy) {
      const key = o.orderBy;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.sort((a: any, b: any) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (o.desc ? -1 : 1));
    }
    if (o.limit) rows = rows.slice(0, o.limit);
    return rows;
  }
  async delete(p: string) {
    const d = this.read();
    delete d[p];
    this.write(d);
  }
}

let store: Store | null = null;
export class StoreUnavailableError extends Error {}

export function getStore(): Store {
  if (store) return store;
  if (firebaseConfigured()) store = new FirestoreStore();
  else if ((isDesktopApp() || !isProduction()) && env("DISABLE_DEV_STORE") !== "1") store = new DevFileStore();
  else throw new StoreUnavailableError("Firebase is not configured (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).");
  return store;
}

/** For tests. */
export function __setStore(s: Store | null) {
  store = s;
}
