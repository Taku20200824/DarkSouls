/**
 * Every value that reaches the UI carries where it came from.
 *  - verified : decoded directly from game data at a documented, sanity-checked location
 *  - inferred : derived from other evidence (e.g. a boss soul held => boss defeated)
 *  - unknown  : could not be determined; value is null
 */
export type Certainty = "verified" | "inferred" | "unknown";

export interface Field<T> {
  value: T | null;
  certainty: Certainty;
  note?: string;
}

export const known = <T>(value: T | null, note?: string): Field<T> =>
  value === null || value === undefined
    ? { value: null, certainty: "unknown", note }
    : { value, certainty: "verified", note };
export const inferred = <T>(value: T, note?: string): Field<T> => ({ value, certainty: "inferred", note });
export const unknown = <T>(note?: string): Field<T> => ({ value: null, certainty: "unknown", note });

export type GameVariant = "dsr" | "ptde";

export type InventoryCategory = "weapons" | "armors" | "rings" | "goods" | "spells";

export interface InventoryItem {
  /** Display name, e.g. "Claymore +5 (Lightning)". */
  name: string;
  /** Base table name without reinforcement, e.g. "Claymore". */
  baseName: string;
  /** Raw item id from the save. */
  id: number;
  category: InventoryCategory;
  quantity: number;
  /** Reinforcement level (weapons/armor only). */
  level?: number;
  /** Infusion path for weapons, e.g. "Lightning". "Normal" for plain reinforcement. */
  infusion?: string;
}

/** Evidence that a boss is dead. */
export type BossEvidence = "flag" | "soul" | "ng-clear";

export interface ParsedCharacter {
  slot: number;
  game: GameVariant;
  name: Field<string>;
  className: Field<string>;
  gender: Field<string>;
  level: Field<number>;
  souls: Field<number>;
  humanity: Field<number>;
  hp: Field<number>;
  stamina: Field<number>;
  stats: Record<
    "Vitality" | "Attunement" | "Endurance" | "Strength" | "Dexterity" | "Resistance" | "Intelligence" | "Faith",
    Field<number>
  >;
  deaths: Field<number>;
  playTimeSeconds: Field<number>;
  ngCycle: Field<number>;
  /** Bonfire NetBonfireDb ids found, with state. */
  bonfires: Field<{ id: number; name: string; area: string; state: string }[]>;
  /** boss canonical name -> evidence list */
  bosses: Record<string, BossEvidence[]>;
  /** World-state flags (bells, lordvessel, covenants joined, NPC states...) by category. */
  worldFlags: Field<Record<string, string[]>>;
  inventory: InventoryItem[];
  unknownItemCount: number;
  /** Things the save format does not expose reliably. */
  notes: string[];
}

export interface ParsedSave {
  game: GameVariant;
  /** All BND4 entry MD5 checksums matched (=> file was fully written). */
  checksumsValid: boolean;
  entryCount: number;
  characters: ParsedCharacter[];
  parserVersion: string;
}

export class SaveParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveParseError";
  }
}
