import { Hono } from "hono";
import { cors } from "hono/cors";
import { decodeParams, encodeParams, type SearchCriteria } from "./search";
import { BODY_STYLE_MAP, CONDITION_MAP, FUEL_TYPE_MAP } from "./constants";
import type { BodyStyleKey, ConditionKey, FuelTypeKey } from "./constants";
import { queryFlareSolverr, FLARESOLVERR_URL } from "./utils";
import { parseSearch } from "./search-parser";
import { parseListing } from "./listing-parser";
import { RedisClient } from "bun";
import { transformCarData } from "./transform";
import type { RawData } from "./transform";
const app = new Hono();

app.use(cors());

const TARGET_URL = "https://www.hasznaltauto.hu/talalatilista";
const CACHE_TTL = 30 * 60; // 30 minutes in seconds
const redis = new RedisClient(process.env.REDIS_URL ?? "redis://192.168.97.2:6379");

await redis.connect();
console.log("Connected to Redis at", process.env.REDIS_URL ?? "redis://192.168.97.2:6379");

interface SearchParams {
  category?: string;
  brandId?: number;
  modelId?: number;
  variant?: string;
  bodyStyle?: BodyStyleKey;
  fuelType?: FuelTypeKey;
  condition?: ConditionKey;
  doors?: 1 | 2 | 3 | 4 | 5;
  seats?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  hufPriceMin?: number;
  hufPriceMax?: number;
  eurPriceMin?: number;
  eurPriceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  engineSizeMin?: number;
  engineSizeMax?: number;

  results?: string;
  // jellemzok?: Partial<Record<JellemzokKey, string>>;
  garancialis_jarmu?: string;
  szalon_jarmu?: string;
  berelheto_jarmu?: string;
  hasDocument?: string;
  hasznalt_jarmu?: string;
  hasVIN?: string;
}

app.post("/search", async (c) => {
  const params: SearchParams = await c.req.json().catch(() => ({}));
  console.log("Received search request with params:", params);

  const intermediate: Partial<SearchCriteria> = {
    marka_id: params.brandId ?? null,
    modell_id: params.modelId ?? null,
    evjarat_min: params.yearMin ?? null,
    evjarat_max: params.yearMax ?? null,
    vetelar_min: params.hufPriceMin ?? null,
    vetelar_max: params.hufPriceMax ?? null,
    eur_vetelar_min: params.eurPriceMin ?? null,
    eur_vetelar_max: params.eurPriceMax ?? null,
    tipusjel: params.variant ?? null,
    kivitel: params.bodyStyle != null ? BODY_STYLE_MAP[params.bodyStyle] : null,
    uzemanyag: params.fuelType != null ? FUEL_TYPE_MAP[params.fuelType] : null,
    allapot: params.condition != null ? CONDITION_MAP[params.condition] : null,
    ajtok_szama: params.doors ?? null,
    ulesek_szama: params.seats ?? null,
    futottkm_min: params.mileageMin ?? null,
    futottkm_max: params.mileageMax ?? null,
    hengerurt_min: params.engineSizeMin ?? null,
    hengerurt_max: params.engineSizeMax ?? null,
  }

  const encodedParams = encodeParams(intermediate);
  console.log("Intermediate params:", intermediate);
  console.log("Encoded params:", encodedParams);
  console.log("Decoded params (for verification):", decodeParams(encodedParams));

  const url = `${TARGET_URL}/${encodedParams}`;
  console.log("Constructed URL for FlareSolverr:", url);

  const cacheKey = `search:${encodedParams}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("Cache hit for search:", cacheKey);
    return c.json(JSON.parse(cached));
  }

  const result = await queryFlareSolverr(url);

  if (result.status !== "ok") {
    return c.json(
      { error: "FlareSolverr returned non-ok status", details: result },
      502,
    );
  }

  const solution = result.solution;
  const rawHtml = solution?.response ?? "";
  const parsed = parseSearch(rawHtml);

  const responseBody = {
    status: result.status,
    status_code: solution?.status,
    url: solution?.url,
    results: parsed,
  };
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseBody));

  return c.json(responseBody);
});

app.get("/listing", async (c) => {
  const targetUrl = c.req.query("url");

  if (!targetUrl) {
    return c.json({ error: "Missing 'url' search parameter" }, 400);
  }

  console.log("Received listing request for URL:", targetUrl);

  const cacheKey = `listing:${targetUrl}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("Cache hit for listing:", cacheKey);
    return c.json(JSON.parse(cached));
  }

  console.log("Forwarding to FlareSolverr:", targetUrl);
  const result = await queryFlareSolverr(targetUrl);
  if (result.status !== "ok") {
    return c.json(
      { error: "FlareSolverr returned non-ok status", details: result },
      502,
    );
  }

  const solution = result.solution;
  const rawHtml = solution?.response ?? "";
  const parsed = parseListing(rawHtml);

  const responseBody = {
    status: result.status,
    status_code: solution?.status,
    url: solution?.url,
    listing: parsed,
  };
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseBody));

  return c.json(responseBody);
});

app.get("/brandsAndModels", async (c) => {
  const url = "https://api.hasznaltauto.hu/v2/tomb/markakSzemelyautoFilter,modellekSzemelyautoFilter";
  const cacheKey = `brandAndModels`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  const res = await fetch(url);
  if (!res.ok) {
    return c.json({ error: "Failed to fetch" }, 502);
  }

  const rawData = await res.json() as RawData;
  const transformedData = transformCarData(rawData);

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(transformedData));
  
  return c.json(transformedData);
});

app.get("/health", async (c) => {
  const healthUrl = FLARESOLVERR_URL.replace("/v1", "/health");
  const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
  const data = await res.json();
  return c.json({ proxy: "ok", flaresolverr: data });
});

export default {
  port: 5555,
  fetch: app.fetch,
};
