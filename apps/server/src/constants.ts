export const BODY_STYLE_MAP: Record<string, number> = {
  sedan: 10,
  notchback: 20,
  buggy: 30,
  convertible: 40,
  coupe: 50,
  mpv: 60,
  hot_rod: 65,
  station_wagon: 70,
  minibus: 80,
  microcar: 85,
  pickup: 90,
  sport: 100,
  off_road: 110,
  crossover: 115,
  hatchback: 120,
  other: 130,
};

export const CONDITION_MAP: Record<string, number> = {
  normal: 1,
  excellent: 2,
  well_maintained: 3,
  as_new: 4,
  damage_free: 5,
  damaged: 6,
  slightly_damaged: 7,
  front_damaged: 8,
  rear_damaged: 9,
  left_side_damaged: 10,
  right_side_damaged: 11,
  incomplete: 14,
  engine_error: 15,
  major_component_error: 16,
  transmission_error: 17,
  electronic_error: 18,
  brake_error: 19,
  chassis_error: 20,
};

export const FUEL_TYPE_MAP: Record<string, number> = {
  petrol: 1,
  diesel: 2,
  petrol_gas: 3,
  diesel_gas: 4,
  hybrid: 5,
  electric: 6,
  ethanol: 7,
  lpg: 8,
  cng: 9,
  biodiesel: 10,
  hybrid_petrol: 11,
  hybrid_diesel: 12,
  gas: 13,
  lpg_diesel: 14,
  cng_diesel: 15,
};

export const JELLEMZOK_MAP = {
  automatic_transmission: "automata",
  all_wheel_drive: "osszkerek",
  isofix: "isofix",
  electric_windows: "elektromos_ablak",
  alloy_wheels: "alufelni",
  cruise_control: "tempomat",
  service_history: "szervizkonyv",
  esp: "esp",
  towbar: "vonohorog",
  vintage: "veteran",
  air_conditioning: "klima",
  valid_documents: "ervenyes_forgalmi",
};

export type JellemzokKey = keyof typeof JELLEMZOK_MAP;
export type BodyStyleKey = keyof typeof BODY_STYLE_MAP;
export type ConditionKey = keyof typeof CONDITION_MAP;
export type FuelTypeKey = keyof typeof FUEL_TYPE_MAP;