import { parse, HTMLElement } from "node-html-parser";

interface CarSpecs {
  fuel?: string;
  year?: string;
  engineSize?: string;
  powerKW?: string;
  powerHP?: string;
  mileage?: string;
}

interface CarAd {
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

const clean = (text: string | undefined): string => {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
};

export function parseSearch(html: string): CarAd[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".talalati-sor");

  return rows.map((row: HTMLElement): CarAd => {
    const titleLink = row.querySelector("h3 a");
    const parkingBtn = row.querySelector(".parkoloBtn");
    const specSpans = row.querySelectorAll(".talalatisor-info.adatok .info");

    // node-html-parser returns an array for querySelectorAll
    // we map them safely based on position
    const specs: CarSpecs = {
      fuel: clean(specSpans[0]?.textContent),
      year: clean(specSpans[1]?.textContent),
      engineSize: clean(specSpans[2]?.textContent),
      powerKW: clean(specSpans[3]?.textContent),
      powerHP: clean(specSpans[4]?.textContent),
      mileage: clean(specSpans[5]?.textContent),
    };

    const features = row
      .querySelectorAll(".cimke-lista .label")
      .map((el) => el.textContent.trim());

    // Note: The price is often in both mobile and desktop divs.
    // We pick the first occurrence.
    const priceText = row.querySelector(".pricefield-primary")?.textContent;

    const imageUrl =
      row.querySelector(".talalatisor-kep img")?.getAttribute("src") ?? null;

    // This regex looks for digits followed by 'x' followed by digits
    const upsizedImageUrl = imageUrl
      ? imageUrl.replace(/\d+x\d+/, "640x480")
      : null;

    return {
      adId: parkingBtn?.getAttribute("data-hirkod") ?? null,
      title: clean(titleLink?.textContent),
      url: titleLink?.getAttribute("href") ?? null,
      imageUrl: upsizedImageUrl,
      price: clean(priceText),
      specs,
      description: clean(
        row.querySelector(".talalati-sor__leiras")?.textContent,
      ),
      trader: clean(row.querySelector(".trader-name")?.textContent).replace(
        "Kereskedés: ",
        "",
      ),
      features,
      isGuaranteed: features.includes("GARANCIÁLIS"),
      hasVerifiedHistory: row.querySelector(".list-item-badge--vin") !== null,
    };
  });
}
