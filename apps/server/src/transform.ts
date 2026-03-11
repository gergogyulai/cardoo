export interface RawItem {
  k: number;
  v: string;
  i?: RawItem[];
}

export interface RawData {
  markakSzemelyautoFilter: RawItem[];
  modellekSzemelyautoFilter: RawItem[];
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseName(raw: string): { name: string; count: number } {
  const match = raw.match(/^(.*?)\s*\((\d+)\)\s*$/);
  if (match) {
    return {
      name: toTitleCase((match[1] ?? "").trim()),
      count: parseInt(match[2] ?? "0", 10),
    };
  }
  return { name: toTitleCase(raw.trim()), count: 0 };
}

export function transformCarData(data: RawData) {
  const brandMap = new Map<number, string>();

  data.markakSzemelyautoFilter.forEach((item) => {
    brandMap.set(item.k, item.v);
  });

  return data.modellekSzemelyautoFilter.map((brandGroup) => {
    const brandId = brandGroup.k;
    const rawBrandName = brandMap.get(brandId) ?? "Unknown";
    const { name: brandName, count: brandCount } = parseName(rawBrandName);

    return {
      id: brandId,
      name: brandName,
      count: brandCount,
      models:
        brandGroup.i?.map((model) => {
          const { name: modelName, count: modelCount } = parseName(model.v);
          return {
            id: model.k,
            name: modelName,
            count: modelCount,
            subModels:
              model.i?.map((sub) => {
                const { name: subName, count: subCount } = parseName(sub.v);
                return {
                  id: sub.k,
                  name: subName,
                  count: subCount,
                };
              }) ?? [],
          };
        }) ?? [],
    };
  });
}