import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Fuel,
  Gauge,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@cardoo/ui/lib/utils";
import type { CarAd } from "./swipe-card";

interface ListingDetail {
  title: string;
  subtitle: string;
  price: {
    main: string | null;
    discounted: string | null;
    discountCondition: string | null;
    priceEur: string | null;
  };
  highlights: {
    year: string | null;
    mileage: string | null;
    fuel: string | null;
    performance: string | null;
    condition: string | null;
    trunk: string | null;
  };
  basicInfo: Record<string, string>;
  equipment: Record<string, string[]>;
  description: string | null;
  seller: {
    name: string | null;
    address: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
  };
  imageUrls: string[];
  adId: string | null;
}

interface ListingDetailProps {
  car: CarAd;
  onClose: () => void;
}

function ImageGallery({ urls, fallbackUrl }: { urls: string[]; fallbackUrl: string | null }) {
  const allUrls = urls.length > 0 ? urls : fallbackUrl ? [fallbackUrl] : [];
  const [current, setCurrent] = useState(0);

  if (allUrls.length === 0) return (
    <div className="w-full aspect-video bg-muted flex items-center justify-center text-muted-foreground/30">
      No photos
    </div>
  );

  return (
    <div className="relative w-full aspect-video bg-black overflow-hidden">
      <img
        key={allUrls[current]}
        src={allUrls[current]}
        alt=""
        className="w-full h-full object-cover"
      />
      {allUrls.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + allUrls.length) % allUrls.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % allUrls.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allUrls.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i === current ? "bg-white" : "bg-white/40",
                )}
              />
            ))}
          </div>
          <span className="absolute top-2 right-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
            {current + 1} / {allUrls.length}
          </span>
        </>
      )}
    </div>
  );
}

export function ListingDetail({ car, onClose }: ListingDetailProps) {
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!car.url) {
      setLoading(false);
      setError("No URL available for this listing.");
      return;
    }
    const serverUrl =
      (import.meta as { env?: Record<string, string> }).env?.VITE_SERVER_URL ??
      "http://localhost:5555";
    setLoading(true);
    setError(null);
    fetch(`${serverUrl}/listing?url=${encodeURIComponent(car.url)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDetail(data.listing ?? null);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [car.url]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* sheet */}
      <div
        ref={sheetRef}
        className="relative z-10 w-full max-w-lg mx-auto rounded-t-3xl bg-card border border-border flex flex-col overflow-hidden"
        style={{ maxHeight: "92dvh" }}
      >
        {/* drag handle + header */}
        <div className="shrink-0 px-5 pt-3 pb-3 border-b border-border flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p
              className="text-base font-semibold text-card-foreground leading-snug truncate"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {car.title}
            </p>
            <p className="text-sm text-amber-400 font-bold tabular-nums" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {car.price}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {car.url && (
              <a
                href={car.url.startsWith("/") ? `https://www.hasznaltauto.hu${car.url}` : car.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Open on hasznaltauto.hu"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* content */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading listing…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-8 text-center">
              <p className="text-sm font-medium text-card-foreground">Failed to load listing</p>
              <p className="text-xs text-muted-foreground font-mono break-all">{error}</p>
            </div>
          ) : detail ? (
            <DetailContent car={car} detail={detail} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-muted-foreground">No detail data returned.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailContent({ car, detail }: { car: CarAd; detail: ListingDetail }) {
  const equipmentEntries = Object.entries(detail.equipment);
  const basicInfoEntries = Object.entries(detail.basicInfo).filter(
    ([k]) => !["Vételár EUR"].includes(k),
  );

  return (
    <div className="flex flex-col">
      {/* Gallery */}
      <ImageGallery urls={detail.imageUrls} fallbackUrl={car.imageUrl} />

      <div className="px-4 py-4 space-y-4">
        {/* Price block */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span
            className="text-2xl font-black text-amber-400 tabular-nums"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {detail.price.main ?? car.price}
          </span>
          {detail.price.priceEur && (
            <span className="text-sm text-muted-foreground">{detail.price.priceEur}</span>
          )}
          {detail.price.discounted && (
            <span className="text-sm text-emerald-400 font-semibold">
              Discounted: {detail.price.discounted}
            </span>
          )}
        </div>

        {/* Key highlights */}
        <div className="grid grid-cols-2 gap-2">
          {([
            [Calendar, detail.highlights.year ?? car.specs.year],
            [Gauge, detail.highlights.mileage ?? car.specs.mileage],
            [Fuel, detail.highlights.fuel ?? car.specs.fuel],
            [Zap, detail.highlights.performance],
          ] as [React.ElementType, string | null | undefined][]).map(
            ([Icon, val], i) =>
              val ? (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{val}</span>
                </div>
              ) : null,
          )}
        </div>

        {/* Badges */}
        {(car.isGuaranteed || car.hasVerifiedHistory) && (
          <div className="flex gap-2 flex-wrap">
            {car.isGuaranteed && (
              <span className="flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                Guaranteed
              </span>
            )}
            {car.hasVerifiedHistory && (
              <span className="flex items-center gap-1 text-xs bg-sky-500/15 text-sky-400 px-2.5 py-1 rounded-full border border-sky-500/30">
                <BadgeCheck className="w-3 h-3 shrink-0" />
                VIN Verified
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {detail.description && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-sm text-card-foreground/80 leading-relaxed whitespace-pre-line">
              {detail.description}
            </p>
          </div>
        )}

        {/* Basic info table */}
        {basicInfoEntries.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Specs
            </h3>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {basicInfoEntries.map(([key, val]) => (
                <div key={key} className="flex items-start px-3 py-2 gap-3">
                  <span className="text-xs text-muted-foreground w-2/5 shrink-0">{key}</span>
                  <span className="text-xs text-card-foreground text-right flex-1">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment / Features */}
        {equipmentEntries.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Equipment
            </h3>
            <div className="space-y-3">
              {equipmentEntries.map(([category, items]) => (
                <div key={category}>
                  <p className="text-xs font-medium text-card-foreground mb-1.5">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span
                        key={item}
                        className="text-xs bg-muted/70 text-muted-foreground border border-border px-2 py-0.5 rounded-md"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seller info */}
        {(detail.seller.name || detail.seller.address || detail.seller.phone || detail.seller.email) && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Seller
            </h3>
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              {detail.seller.name && (
                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-card-foreground">{detail.seller.name}</span>
                </div>
              )}
              {detail.seller.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{detail.seller.address}</span>
                </div>
              )}
              {detail.seller.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <a href={`tel:${detail.seller.phone}`} className="text-sm text-sky-400 hover:underline">
                    {detail.seller.phone}
                  </a>
                </div>
              )}
              {detail.seller.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <a href={`mailto:${detail.seller.email}`} className="text-sm text-sky-400 hover:underline break-all">
                    {detail.seller.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        {car.url && (
          <a
            href={car.url.startsWith("/") ? `https://www.hasznaltauto.hu${car.url}` : car.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" />
            View on hasznaltauto.hu
          </a>
        )}

        <div className="pb-safe h-4" />
      </div>
    </div>
  );
}
