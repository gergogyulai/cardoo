import type { Route } from "./+types/_index";
import { useState } from "react";
import { useNavigate } from "react-router";

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Barlow+Condensed:wght@400;700;900&display=swap",
  },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "cardoo — find your car" },
    { name: "description", content: "Browse cars the Tinder way" },
  ];
}

export interface TransformedData {
  id: number;
  name: string;
  count: number;
  models: {
    id: number;
    name: string;
    count: number;
    subModels: {
      id: number;
      name: string;
      count: number;
    }[];
  }[];
}

export async function clientLoader() {
  const serverUrl =
    (import.meta as { env?: Record<string, string> }).env?.VITE_SERVER_URL ??
    "http://localhost:5555";
  try {
    const res = await fetch(`${serverUrl}/brandsAndModels`);
    const brands: TransformedData[] = res.ok ? await res.json() : [];
    return { brands };
  } catch {
    return { brands: [] as TransformedData[] };
  }
}

clientLoader.hydrate = true as const;

const FUEL_OPTIONS = [
  { value: "", label: "Any fuel" },
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "hybrid_petrol", label: "Hybrid (petrol)" },
  { value: "hybrid_diesel", label: "Hybrid (diesel)" },
  { value: "electric", label: "Electric" },
  { value: "petrol_gas", label: "Petrol + LPG" },
  { value: "lpg", label: "LPG" },
];

const BODY_OPTIONS = [
  { value: "", label: "Any body style" },
  { value: "sedan", label: "Sedan" },
  { value: "hatchback", label: "Hatchback" },
  { value: "station_wagon", label: "Station Wagon" },
  { value: "coupe", label: "Coupé" },
  { value: "convertible", label: "Convertible" },
  { value: "mpv", label: "MPV" },
  { value: "off_road", label: "SUV / Off-Road" },
  { value: "crossover", label: "Crossover" },
  { value: "pickup", label: "Pickup" },
];

const SELECT_CLS =
  "w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
const INPUT_CLS =
  "w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { brands = [] } = loaderData ?? { brands: [] };
  const [makeId, setMakeId] = useState("");

  const availableModels = brands.find((b) => String(b.id) === makeId)?.models ?? [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of fd.entries()) {
      if (value) params.set(key, String(value));
    }
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-3rem)] px-4 py-8">
      {/* Branding */}
      <div className="mb-8 text-center">
        <h1
          className="text-5xl font-bold text-foreground mb-2"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          cardoo
        </h1>
        <p className="text-sm text-muted-foreground">Find your next car, swipe by swipe</p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5 space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Make</label>
            <select
              name="brandId"
              value={makeId}
              onChange={(e) => setMakeId(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Any make</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.count})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Model</label>
            <select
              key={makeId}
              name="modelId"
              disabled={!makeId}
              className={SELECT_CLS}
            >
              <option value="">Any model</option>
              {availableModels.map((m) =>
                m.subModels.length > 0 ? (
                  <optgroup key={m.id} label={`${m.name} (${m.count})`}>
                    <option value={m.id}>All {m.name}</option>
                    {m.subModels.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.count})
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.count})
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Fuel type</label>
            <select name="fuelType" className={SELECT_CLS}>
              {FUEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Body style</label>
            <select name="bodyStyle" className={SELECT_CLS}>
              {BODY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Year</label>
          <div className="flex items-center gap-2">
            <input
              name="yearMin"
              type="number"
              placeholder="From"
              min={1990}
              max={2026}
              className={INPUT_CLS}
            />
            <span className="text-xs text-muted-foreground shrink-0">–</span>
            <input
              name="yearMax"
              type="number"
              placeholder="To"
              min={1990}
              max={2026}
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Max price (HUF)</label>
            <input
              name="priceMax"
              type="number"
              placeholder="e.g. 5 000 000"
              min={0}
              step={100000}
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Max mileage (km)</label>
            <input
              name="mileageMax"
              type="number"
              placeholder="e.g. 150 000"
              min={0}
              step={10000}
              className={INPUT_CLS}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-10 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity mt-1"
        >
          Search cars
        </button>
      </form>
    </div>
  );
}
