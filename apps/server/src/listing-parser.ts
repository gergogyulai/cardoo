import { parse, HTMLElement } from "node-html-parser";

interface CarListing {
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

function cleanText(text: string | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function parseBasicInfoSection(root: HTMLElement): Record<string, string> {
  const result: Record<string, string> = {};

  root.querySelectorAll(".print-basic-info-item").forEach((item) => {
    const cols = item.querySelectorAll(".col-6");
    if (cols.length >= 2) {
      const key = cleanText(cols[0]!.text);
      const value = cleanText(cols[1]!.text);
      if (key && value) {
        result[key] = value;
      }
    }
  });

  return result;
}

function parseEquipment(root: HTMLElement): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  const equipmentSection = root.querySelector(
    "#details-vehicle-information .d-flex.flex-column.shadow-sm.rounded-1.bg-white:last-of-type"
  );

  if (!equipmentSection) return result;

  equipmentSection.querySelectorAll(".d-flex.flex-column.gap-3 > div").forEach(
    (section) => {
      const heading = section.querySelector(".mb-3.fw-bold");
      const items = section.querySelectorAll("li");

      if (!heading || items.length === 0) return;

      const category = cleanText(heading.text);
      result[category] = Array.from(items).map((li) => cleanText(li.text));
    }
  );

  return result;
}

function parseImageUrls(root: HTMLElement): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  // Pull from the gallery data attribute (highest quality thumbnails in gallery)
  const galleryEl = root.querySelector("[data-details--gallery-elements-value]");
  if (galleryEl) {
    try {
      const elements = JSON.parse(
        galleryEl.getAttribute("data-details--gallery-elements-value") ?? "[]"
      );
      for (const el of elements) {
        if (el.url && !seen.has(el.url)) {
          seen.add(el.url);
          urls.push(el.url);
        }
      }
    } catch {
      // fall through to img fallback
    }
  }

  // Fallback: scrape thumbnail images
  if (urls.length === 0) {
    root
      .querySelectorAll(".gallery__thumbnail-item img")
      .forEach((img) => {
        const src = img.getAttribute("src");
        if (src && !seen.has(src)) {
          seen.add(src);
          urls.push(src);
        }
      });
  }

  return urls;
}

export function parseListing(html: string): CarListing {
  const root = parse(html);

  // Title & subtitle
  const title = cleanText(root.querySelector("h1")?.text);
  const subtitle = cleanText(
    root.querySelector(".details__gallery-subtitle")?.text
  );

  // Price block (use the first visible one)
  const priceBlock = root.querySelector(".col-12.col-md-6 .price__main");
  const mainPrice = cleanText(priceBlock?.text ?? undefined);

  const discountedEl = root.querySelector(
    ".col-12.col-md-6 .text-brand"
  );
  const discountedRaw = cleanText(discountedEl?.text ?? "");
  // Strip "Akciós: " prefix
  const discounted = discountedRaw.replace(/^Akciós:\s*/i, "") || null;

  const discountConditionEl = root.querySelector(
    ".col-12.col-md-6 [data-bs-content]"
  );
  const discountCondition =
    discountConditionEl?.getAttribute("data-bs-content") ?? null;

  // Basic info map includes "Vételár EUR"
  const basicInfo = parseBasicInfoSection(root);
  const priceEur = basicInfo["Vételár EUR"] ?? null;

  // Highlighted info
  const highlightedSection = root.querySelector(
    "#details-highlighted-info"
  );
  function getHighlight(testId: string): string | null {
    const el = highlightedSection?.querySelector(
      `[data-testid="${testId}"] .col-6:not(.text-body-secondary)`
    );
    return el ? cleanText(el.text) : null;
  }

  const highlights = {
    year: getHighlight("highlighted-info-manufacture-date"),
    mileage: getHighlight("highlighted-info-mileage"),
    fuel: getHighlight("highlighted-info-fuel"),
    performance: getHighlight("highlighted-info-performance"),
    condition: getHighlight("highlighted-info-condition"),
    trunk:
      cleanText(
        highlightedSection
          ?.querySelectorAll(".print-highlighted-info__item")
          .find((el) =>
            el.querySelector(".text-body-secondary")?.text.includes(
              "Csomagtartó"
            )
          )
          ?.querySelector("div > div:last-child")?.text
      ) || null,
  };

  // Equipment
  const equipment = parseEquipment(root);

  // Description
  const description = cleanText(
    root.querySelector(".description__text")?.text
  );

  // Seller info
  const sellerName = cleanText(
    root.querySelector("[data-testid='details-seller-name']")?.text
  );
  const addressEl = root.querySelector("[data-details--map-location-param]");
  const address =
    addressEl?.getAttribute("data-details--map-location-param") ?? null;

  const websiteEl = root.querySelector("[data-testid='details-seller-website']");
  const website = cleanText(websiteEl?.text) || null;

  const emailEl = root.querySelector("[data-contact-type='email']");
  const email = emailEl?.getAttribute("data-contact-value") ?? null;

  const phoneEl = root.querySelector(
    "[data-contact-type='phone-primary']"
  );
  const phone = phoneEl?.getAttribute("data-contact-value") ?? null;

  // Ad ID
  const adIdMatch = root
    .querySelector(".print-details-id")
    ?.text.match(/\d+/);
  const adId = adIdMatch ? adIdMatch[0] : null;

  // Images
  const imageUrls = parseImageUrls(root);

  return {
    title,
    subtitle,
    price: {
      main: mainPrice || null,
      discounted,
      discountCondition,
      priceEur,
    },
    highlights,
    basicInfo,
    equipment,
    description: description || null,
    seller: {
      name: sellerName || null,
      address,
      website,
      email,
      phone,
    },
    imageUrls,
    adId,
  };
}