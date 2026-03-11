import { deflateSync, inflateSync } from "zlib";
import { encode as base32Encode, decode as base32Decode } from "hi-base32";
import { serialize, unserialize } from "php-serialize";

export interface SearchCriteria {
  kategoriaNev: "szemelyauto" | "motor" | "haszongepjarmu" | string;
  alkategoriaNev: string | null;
  // Price
  vetelar_min: number | null;
  vetelar_max: number | null;
  eur_vetelar_min: number | null;
  eur_vetelar_max: number | null;
  // Basic vehicle info
  marka_id: number | null;
  modell_id: number | null;
  tipusjel: string | null;
  kivitel: number | null;
  // Condition and listing type
  hasznalt_jarmu: 1 | 0;
  garancialis_jarmu: 1 | 0;
  szalon_jarmu: 1 | 0;
  berelheto_jarmu: 1 | 0;
  allapot: string | number | null;
  // Specs
  evjarat_min: number | null;
  evjarat_max: number | null;
  futottkm_min: number | null;
  futottkm_max: number | null;
  uzemanyag: string | number | null;
  hengerurt_min: number | null;
  hengerurt_max: number | null;
  ajtok_szama: number | null;
  ulesek_szama: number | null;
  // Features & Docs
  jellemzok: number[] | null;
  hasVIN: 1 | 0 | null;
  hasDocument: 1 | 0 | null;
  // Results control
  results: number;
}

const DEFAULTS: SearchCriteria = {
  kategoriaNev: "szemelyauto",
  alkategoriaNev: null,
  vetelar_min: null,
  vetelar_max: null,
  eur_vetelar_min: null,
  eur_vetelar_max: null,
  marka_id: null,
  modell_id: null,
  tipusjel: null,
  kivitel: null,
  hasznalt_jarmu: 1,
  garancialis_jarmu: 1,
  szalon_jarmu: 1,
  berelheto_jarmu: 1,
  allapot: null,
  evjarat_min: null,
  evjarat_max: null,
  futottkm_min: null,
  futottkm_max: null,
  uzemanyag: null,
  hengerurt_min: null,
  hengerurt_max: null,
  ajtok_szama: null,
  ulesek_szama: null,
  jellemzok: null,
  hasVIN: null,
  hasDocument: null,
  results: 75,
};

export function encodeParams(overrides: Partial<SearchCriteria> = {}): string {
  const defined = Object.fromEntries(
    Object.entries(overrides).filter(([, v]) => v !== undefined),
  ) as Partial<SearchCriteria>;
  const params: SearchCriteria = { ...DEFAULTS, ...defined };
  const serialized = serialize(params);
  const compressed = deflateSync(Buffer.from(serialized));
  return base32Encode(compressed).replace(/=/g, "");
}

export function decodeParams(encoded: string): SearchCriteria {
  const padding = (8 - (encoded.length % 8)) % 8;
  const padded = encoded + "=".repeat(padding);
  const compressed = Buffer.from(base32Decode.asBytes(padded));
  const decompressed = inflateSync(compressed).toString("utf-8");
  return unserialize(decompressed) as SearchCriteria;
}