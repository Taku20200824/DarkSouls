import { z } from "zod";

/** Validation for parsed character payloads sent by the browser or the companion. */
const cert = z.enum(["verified", "inferred", "unknown"]);
const field = <T extends z.ZodTypeAny>(t: T) => z.object({ value: t.nullable(), certainty: cert, note: z.string().max(300).optional() });
const name = z.string().max(120);
const int = z.number().int().min(0).max(2_000_000_000);

export const InventoryItemSchema = z.object({
  name,
  baseName: name,
  id: int,
  category: z.enum(["weapons", "armors", "rings", "goods", "spells"]),
  quantity: z.number().int().min(0).max(1_000_000),
  level: z.number().int().min(0).max(99).optional(),
  infusion: z.string().max(20).optional(),
});

const stat = field(z.number().int().min(0).max(99));
export const CharacterSchema = z.object({
  slot: z.number().int().min(0).max(9),
  game: z.enum(["dsr", "ptde"]),
  name: field(z.string().max(32)),
  className: field(z.string().max(20)),
  gender: field(z.string().max(10)),
  level: field(z.number().int().min(0).max(838)),
  souls: field(int),
  humanity: field(z.number().int().min(0).max(255)),
  hp: field(int),
  stamina: field(int),
  stats: z.object({
    Vitality: stat, Attunement: stat, Endurance: stat, Strength: stat,
    Dexterity: stat, Resistance: stat, Intelligence: stat, Faith: stat,
  }),
  deaths: field(int),
  playTimeSeconds: field(int),
  ngCycle: field(z.number().int().min(0).max(255)),
  bonfires: field(z.array(z.object({ id: int, name, area: name, state: z.string().max(20) })).max(80)),
  bosses: z.record(name, z.array(z.enum(["flag", "soul", "ng-clear"])).max(3)).refine((r) => Object.keys(r).length <= 60),
  worldFlags: field(z.record(name, z.array(name).max(80)).refine((r) => Object.keys(r).length <= 30)),
  inventory: z.array(InventoryItemSchema).max(2048),
  unknownItemCount: int,
  notes: z.array(z.string().max(300)).max(20),
});

export const SyncPayloadSchema = z.object({
  parserVersion: z.string().max(40),
  game: z.enum(["dsr", "ptde"]),
  checksumsValid: z.boolean(),
  characters: z.array(CharacterSchema).max(10),
  saveModifiedAt: z.number().int().positive().optional(),
  client: z.enum(["browser-upload", "companion"]),
  consent: z.literal(true),
});

export type SyncPayload = z.infer<typeof SyncPayloadSchema>;
