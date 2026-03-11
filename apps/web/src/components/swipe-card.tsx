import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Car, Calendar, Fuel, Gauge, ShieldCheck, Store, Zap } from "lucide-react";
import { cn } from "@cardoo/ui/lib/utils";

export interface CarSpecs {
  fuel?: string;
  year?: string;
  engineSize?: string;
  powerKW?: string;
  powerHP?: string;
  mileage?: string;
}

export interface CarAd {
  adId: string | null;
  title: string;
  url: string | null;
  imageUrl: string | null;
  price: string;
  specs: CarSpecs;
  description: string;
  trader: string;
  features: string[];
  isGuaranteed: boolean;
  hasVerifiedHistory: boolean;
}

interface SwipeCardProps {
  car: CarAd;
  onSwipe: (direction: "like" | "dislike") => void;
  isTop: boolean;
  stackIndex: number;
  externalSwipe?: "like" | "dislike" | null;
}

function SpecPill({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
      <Icon className="w-3 h-3 opacity-60 shrink-0" />
      {children}
    </span>
  );
}

export function SwipeCard({
  car,
  onSwipe,
  isTop,
  stackIndex,
  externalSwipe,
}: SwipeCardProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyDirection, setFlyDirection] = useState<"like" | "dislike" | null>(null);

  const startPos = useRef({ x: 0, y: 0 });
  const cardEl = useRef<HTMLDivElement>(null);
  const onSwipeRef = useRef(onSwipe);

  useEffect(() => {
    onSwipeRef.current = onSwipe;
  });

  // Handle button-triggered swipe
  useEffect(() => {
    if (externalSwipe && isTop && !flyDirection) {
      const dir = externalSwipe;
      setFlyDirection(dir);
      const timer = setTimeout(() => onSwipeRef.current(dir), 450);
      return () => clearTimeout(timer);
    }
  }, [externalSwipe, isTop, flyDirection]);

  const triggerFly = (dir: "like" | "dislike") => {
    setIsDragging(false);
    setFlyDirection(dir);
    setTimeout(() => onSwipeRef.current(dir), 450);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTop || flyDirection) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    cardEl.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setDragOffset({
      x: e.clientX - startPos.current.x,
      y: (e.clientY - startPos.current.y) * 0.25,
    });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset.x > 80) {
      triggerFly("like");
    } else if (dragOffset.x < -80) {
      triggerFly("dislike");
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const likeOpacity = Math.min(Math.max(dragOffset.x / 80, 0), 1);
  const nopeOpacity = Math.min(Math.max(-dragOffset.x / 80, 0), 1);
  const rotation = dragOffset.x / 16;

  let cardStyle: React.CSSProperties;
  if (flyDirection) {
    cardStyle = {
      transform: `translateX(${flyDirection === "like" ? 1400 : -1400}px) rotate(${flyDirection === "like" ? 30 : -30}deg)`,
      transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.35s",
      opacity: 0,
      zIndex: 30,
    };
  } else if (isTop) {
    cardStyle = {
      transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
      transition: isDragging
        ? "none"
        : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      zIndex: 20,
    };
  } else {
    cardStyle = {
      transform: `scale(${1 - stackIndex * 0.04}) translateY(${stackIndex * 16}px)`,
      transition: "transform 0.35s ease",
      zIndex: 20 - stackIndex * 5,
    };
  }

  const powerLabel = [car.specs.powerKW, car.specs.powerHP]
    .filter(Boolean)
    .join(" / ");

  return (
    <div
      ref={cardEl}
      style={cardStyle}
      className={cn(
        "absolute inset-0 overflow-hidden rounded-3xl bg-card shadow-[0_25px_70px_rgba(0,0,0,0.65)] select-none",
        isTop && !flyDirection
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* LIKE stamp */}
      <div
        className="absolute top-8 left-5 z-30 -rotate-12 border-[3px] border-emerald-400 rounded-xl px-4 py-1.5 pointer-events-none"
        style={{
          opacity: likeOpacity,
          transition: isDragging ? "none" : "opacity 0.15s",
        }}
      >
        <span
          className="block text-emerald-400 text-2xl font-black tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          LIKE
        </span>
      </div>

      {/* NOPE stamp */}
      <div
        className="absolute top-8 right-5 z-30 rotate-12 border-[3px] border-rose-500 rounded-xl px-4 py-1.5 pointer-events-none"
        style={{
          opacity: nopeOpacity,
          transition: isDragging ? "none" : "opacity 0.15s",
        }}
      >
        <span
          className="block text-rose-500 text-2xl font-black tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          NOPE
        </span>
      </div>

      {/* Car image */}
      <div className="relative w-full h-[58%] bg-muted overflow-hidden">
        {car.imageUrl ? (
          <img
            src={car.imageUrl}
            alt={car.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-muted">
            <Car className="w-14 h-14 text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/40 uppercase tracking-widest">
              No Photo
            </span>
          </div>
        )}
        {/* Gradient fade into card */}
        <div className="absolute inset-0 bg-linear-to-t from-card via-card/20 to-transparent pointer-events-none" />
      </div>

      {/* Info section */}
      <div className="px-5 pt-2 pb-5 flex flex-col gap-3">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-3">
          <h2
            className="text-lg leading-tight text-card-foreground flex-1 min-w-0"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {car.title}
          </h2>
          <span
            className="text-xl font-black text-amber-400 whitespace-nowrap shrink-0 tabular-nums"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {car.price}
          </span>
        </div>

        {/* Spec pills */}
        <div className="flex flex-wrap gap-1.5">
          {car.specs.year && (
            <SpecPill icon={Calendar}>{car.specs.year}</SpecPill>
          )}
          {car.specs.mileage && (
            <SpecPill icon={Gauge}>{car.specs.mileage}</SpecPill>
          )}
          {car.specs.fuel && (
            <SpecPill icon={Fuel}>{car.specs.fuel}</SpecPill>
          )}
          {powerLabel && <SpecPill icon={Zap}>{powerLabel}</SpecPill>}
        </div>

        {/* Badges + Trader */}
        <div className="flex items-center justify-between gap-2 min-h-5.5">
          <div className="flex gap-1.5 flex-wrap">
            {car.isGuaranteed && (
              <span className="flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                Guaranteed
              </span>
            )}
            {car.hasVerifiedHistory && (
              <span className="flex items-center gap-1 text-xs bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/30">
                <BadgeCheck className="w-3 h-3 shrink-0" />
                VIN Verified
              </span>
            )}
          </div>
          {car.trader && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground/70 shrink-0">
              <Store className="w-3 h-3 shrink-0" />
              <span className="max-w-27.5 truncate">{car.trader}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
