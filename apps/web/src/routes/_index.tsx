import type { Route } from "./+types/_index";
import { useEffect, useState } from "react";
import { ExternalLink, Heart, Loader2, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Form, useNavigate, useNavigation, useSearchParams } from "react-router";
import { cn } from "@cardoo/ui/lib/utils";
import { SwipeCard, type CarAd } from "../components/swipe-card";

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

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const serverUrl =
    (import.meta as { env?: Record<string, string> }).env?.VITE_SERVER_URL ??
    "http://localhost:5555";
  const sp = new URL(request.url).searchParams;
  const body: Record<string, unknown> = {};
  if (sp.get("fuelType")) body.fuelType = sp.get("fuelType");
  if (sp.get("bodyStyle")) body.bodyStyle = sp.get("bodyStyle");
  if (sp.get("yearMin")) body.yearMin = Number(sp.get("yearMin"));
  if (sp.get("yearMax")) body.yearMax = Number(sp.get("yearMax"));
  if (sp.get("priceMax")) body.hufPriceMax = Number(sp.get("priceMax"));
  if (sp.get("mileageMax")) body.mileageMax = Number(sp.get("mileageMax"));
  if (sp.get("brandId")) body.brandId = Number(sp.get("brandId"));
  if (sp.get("modelId")) body.modelId = Number(sp.get("modelId"));
  try {
    const [searchRes, brandsRes] = await Promise.all([
      fetch(`${serverUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      fetch(`${serverUrl}/brandsAndModels`),
    ]);
    if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`);
    const data = await searchRes.json();
    const brands: TransformedData[] = brandsRes.ok ? await brandsRes.json() : [];
    return { cars: (data.results ?? []) as CarAd[], brands, error: null };
  } catch (e) {
    return { cars: [] as CarAd[], brands: [] as TransformedData[], error: String(e) };
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
  "w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
const INPUT_CLS =
  "w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

export default function Home({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<CarAd[]>([]);
  const [pendingSwipe, setPendingSwipe] = useState<"like" | "dislike" | null>(null);
  const [filterMakeId, setFilterMakeId] = useState(searchParams.get("brandId") ?? "");

  useEffect(() => {
    setFilterMakeId(searchParams.get("brandId") ?? "");
  }, [searchParams]);

  const isLoading = !loaderData || navigation.state === "loading";
  const hasActiveFilters = Array.from(searchParams.values()).some(Boolean);

  // Reset card state whenever the search results change
  useEffect(() => {
    setCurrentIndex(0);
    setLiked([]);
    setPendingSwipe(null);
  }, [loaderData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading cars…</p>
      </div>
    );
  }

  const { cars, brands = [], error } = loaderData;
  const availableModels = brands.find((b) => String(b.id) === filterMakeId)?.models ?? [];
  const remaining = cars.length - currentIndex;
  const visibleCars = cars.slice(currentIndex, currentIndex + 3);

  const handleSwipe = (direction: "like" | "dislike") => {
    setPendingSwipe(null);
    if (direction === "like" && cars[currentIndex]) {
      setLiked((prev) => [...prev, cars[currentIndex]!]);
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleButton = (direction: "like" | "dislike") => {
    if (pendingSwipe !== null || remaining === 0) return;
    setPendingSwipe(direction);
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-3rem)] px-4 pt-4 pb-8">
      {/* Stats bar */}
      <div className="w-full max-w-sm flex justify-between items-center mb-2 px-1">
        <span className="text-sm text-muted-foreground">
          {remaining > 0 ? `${remaining} cars` : "All done"}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => liked.length > 0 && setShowLiked(true)}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            {liked.length} liked
          </span>
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={cn(
              "ml-1 p-1.5 rounded-md border transition-colors duration-150",
              hasActiveFilters || showFilters
                ? "border-ring bg-ring/10 text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="w-full max-w-sm mb-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4">
          <Form key={searchParams.toString()} method="get" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Make</label>
                <select
                  name="brandId"
                  value={filterMakeId}
                  onChange={(e) => setFilterMakeId(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="">Any make</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.count})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Model</label>
                <select
                  key={filterMakeId}
                  name="modelId"
                  defaultValue={searchParams.get("modelId") ?? ""}
                  disabled={!filterMakeId}
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
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Fuel type</label>
                <select name="fuelType" defaultValue={searchParams.get("fuelType") ?? ""} className={SELECT_CLS}>
                  {FUEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Body style</label>
                <select name="bodyStyle" defaultValue={searchParams.get("bodyStyle") ?? ""} className={SELECT_CLS}>
                  {BODY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Year</label>
              <div className="flex items-center gap-2">
                <input name="yearMin" type="number" placeholder="From" min={1990} max={2026}
                  defaultValue={searchParams.get("yearMin") ?? ""} className={INPUT_CLS} />
                <span className="text-xs text-muted-foreground shrink-0">–</span>
                <input name="yearMax" type="number" placeholder="To" min={1990} max={2026}
                  defaultValue={searchParams.get("yearMax") ?? ""} className={INPUT_CLS} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Max price (HUF)</label>
                <input name="priceMax" type="number" placeholder="e.g. 5 000 000" min={0} step={100000}
                  defaultValue={searchParams.get("priceMax") ?? ""} className={INPUT_CLS} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Max mileage (km)</label>
                <input name="mileageMax" type="number" placeholder="e.g. 150 000" min={0} step={10000}
                  defaultValue={searchParams.get("mileageMax") ?? ""} className={INPUT_CLS} />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 h-8 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Search
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => navigate(".")}
                  className="h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </Form>
        </div>
      )}

      {/* Card stack */}
      <div className="relative w-full max-w-sm" style={{ height: 520 }}>
        {error ? (
          <ErrorState message={error} />
        ) : remaining === 0 ? (
          <EmptyState liked={liked.length} />
        ) : (
          [...visibleCars].reverse().map((car, reversedI) => {
            const i = visibleCars.length - 1 - reversedI;
            return (
              <SwipeCard
                key={car.adId ?? car.url ?? `${currentIndex + i}`}
                car={car}
                isTop={i === 0}
                stackIndex={i}
                onSwipe={i === 0 ? handleSwipe : () => {}}
                externalSwipe={i === 0 ? pendingSwipe : null}
              />
            );
          })
        )}
      </div>

      {/* Action buttons */}
      {remaining > 0 && !error && (
        <div className="flex items-center gap-8 mt-8">
          <ActionButton
            onClick={() => handleButton("dislike")}
            variant="dislike"
            disabled={pendingSwipe !== null}
          />
          <ActionButton
            onClick={() => handleButton("like")}
            variant="like"
            disabled={pendingSwipe !== null}
          />
        </div>
      )}

      {/* Liked cars panel */}
      {showLiked && (
        <LikedPanel cars={liked} onClose={() => setShowLiked(false)} />
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  variant,
  disabled,
}: {
  onClick: () => void;
  variant: "like" | "dislike";
  disabled?: boolean;
}) {
  const isLike = variant === "like";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-16 h-16 rounded-full border flex items-center justify-center shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
        isLike
          ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400/60 hover:scale-105 active:scale-95"
          : "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-400/60 hover:scale-105 active:scale-95",
      )}
    >
      {isLike ? (
        <Heart className="w-7 h-7 text-emerald-400" />
      ) : (
        <X className="w-7 h-7 text-rose-400" />
      )}
    </button>
  );
}

function EmptyState({ liked }: { liked: number }) {
  return (
    <div className="absolute inset-0 rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-4">
      <div className="text-5xl">🎉</div>
      <p
        className="text-card-foreground font-semibold text-xl"
        style={{ fontFamily: "'DM Serif Display', serif" }}
      >
        All caught up!
      </p>
      <p className="text-sm text-muted-foreground">
        {liked > 0 ? `You liked ${liked} car${liked === 1 ? "" : "s"}` : "No cars liked yet"}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 rounded-3xl bg-card border border-border flex flex-col items-center justify-center gap-3 px-8 text-center">
      <p className="text-card-foreground font-medium">Could not connect to server</p>
      <p className="text-xs text-muted-foreground font-mono break-all">{message}</p>
    </div>
  );
}

function LikedPanel({ cars, onClose }: { cars: CarAd[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* sheet */}
      <div className="relative z-10 w-full max-w-lg mx-auto rounded-t-3xl bg-card border border-border flex flex-col max-h-[80vh]">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <span
            className="text-lg font-semibold text-card-foreground flex items-center gap-2"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            {cars.length} liked car{cars.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* list */}
        <div className="overflow-y-auto p-4 space-y-3">
          {cars.map((car) => (
            <div
              key={car.adId ?? car.url ?? car.title}
              className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 overflow-hidden"
            >
              {/* thumbnail */}
              <div className="w-24 h-20 shrink-0 bg-muted overflow-hidden">
                {car.imageUrl ? (
                  <img
                    src={car.imageUrl}
                    alt={car.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                      <path d="M3 13.5L5.5 7h13l2.5 6.5V19H3v-5.5z" />
                    </svg>
                  </div>
                )}
              </div>
              {/* info */}
              <div className="flex-1 min-w-0 py-2 pr-3">
                <p className="text-sm font-medium text-card-foreground leading-snug truncate">{car.title}</p>
                <p className="text-sm text-rose-400 font-semibold mt-0.5">{car.price}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {car.specs.year && <span>{car.specs.year}</span>}
                  {car.specs.mileage && <span>· {car.specs.mileage}</span>}
                  {car.specs.fuel && <span>· {car.specs.fuel}</span>}
                </div>
              </div>
              {/* link */}
              {car.url && (
                <a
                  href={car.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 mr-3 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Open listing"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
