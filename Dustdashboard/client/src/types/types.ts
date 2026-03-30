export const dustType = [1.0, 0.5, 0.3, 0.1]

export const STATIC_LOCATIONS = Array.from({ length: 19 }, (_, i) =>
  `IS-1K-${String(i + 1).toString().padStart(3, "0")}`
);

export const DUST_MODE_ORDER = [
  "IS-1K-003", "IS-1K-002", "IS-1K-001", "IS-1K-004", "IS-1K-005",
  "IS-1K-006", "IS-1K-010", "IS-1K-007", "IS-1K-008", "IS-1K-009",
  "IS-1K-011", "IS-1K-013", "IS-1K-012", "IS-1K-014", "IS-1K-015",
  "IS-1K-016", "IS-1K-019", "IS-1K-018", "IS-1K-017",
];

export interface DustMeasurement {
  measurement_id: number;
  measurement_datetime: string;
  room: string;
  area: string;
  location_name: string;
  dust_value: number;
  dust_type: number;
  count: number;
  alarm_high: number;
  running_state: number;
}

export interface FetchedData {
  measurement_id: number;
  measurement_datetime: string;
  room: string;
  area: string;
  location_name: string;
  count: number;
  running_state: number;
  alarm_high: number;
  um01?: number;
  um03?: number;
  um05?: number;
}