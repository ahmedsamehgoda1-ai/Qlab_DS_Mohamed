import { DefectRecord } from "@/types";

export interface ColumnDef {
  key: string;
  header: string;
  /** Value used for sorting — numbers/dates sort naturally, strings alphabetically. */
  sortValue: (d: DefectRecord) => string | number;
  /** Value shown in the cell. */
  render: (d: DefectRecord) => string;
  align?: "left" | "right";
  minWidth?: string;
}


export const COLUMNS: ColumnDef[] = [
  {
    key: "date",
    header: "Date",
    sortValue: (d) => d.date,
    render: (d) => d.date,
    minWidth: "min-w-[100px]",
  },
  {
    key: "time",
    header: "Time",
    sortValue: (d) => d.time,
    render: (d) => d.time,
    minWidth: "min-w-[80px]",
  },
  {
    key: "defectName",
    header: "Defect Name",
    sortValue: (d) => d.defectName,
    render: (d) => d.defectName,
    minWidth: "min-w-[190px]",
  },
  {
    key: "station",
    header: "Station",
    sortValue: (d) => d.station,
    render: (d) => d.station,
    minWidth: "min-w-[210px]",
  },
  {
    key: "partOfCar",
    header: "Part of the Car",
    sortValue: (d) => d.partOfCar,
    render: (d) => d.partOfCar,
    minWidth: "min-w-[140px]",
  },
  {
    key: "reporterName",
    header: "Reporter",
    sortValue: (d) => d.reporterName,
    render: (d) => d.reporterName,
    minWidth: "min-w-[140px]",
  },
  {
    key: "partNumber",
    header: "Part Number",
    sortValue: (d) => d.partNumber,
    render: (d) => String(d.partNumber),
    align: "right",
    minWidth: "min-w-[110px]",
  },
  {
    key: "severityRating",
    header: "Severity",
    sortValue: (d) => d.severityRating,
    render: (d) => String(d.severityRating),
    align: "right",
    minWidth: "min-w-[90px]",
  },
  {
    key: "severityCategory",
    header: "Severity Category",
    sortValue: (d) => d.severityCategory,
    render: (d) => d.severityCategory,
    minWidth: "min-w-[240px]",
  },
  {
    key: "carModel",
    header: "Model",
    sortValue: (d) => d.carModel,
    render: (d) => d.carModel,
    minWidth: "min-w-[90px]",
  },
  {
    key: "motorType",
    header: "Motor Type",
    sortValue: (d) => d.motorType,
    render: (d) => d.motorType,
    minWidth: "min-w-[140px]",
  },
  {
    key: "designPackage",
    header: "Design Package",
    sortValue: (d) => d.designPackage,
    render: (d) => d.designPackage,
    minWidth: "min-w-[130px]",
  },
  {
    key: "productionShift",
    header: "Shift",
    sortValue: (d) => d.productionShift,
    render: (d) => d.productionShift,
    minWidth: "min-w-[100px]",
  },
  {
    key: "effectiveResolutionDays",
    header: "Resolution (d)",
    sortValue: (d) => d.effectiveResolutionDays,
    render: (d) => `${d.effectiveResolutionDays.toFixed(2)}${d.isCensored ? "*" : ""}`,
    align: "right",
    minWidth: "min-w-[120px]",
  },
  {
    key: "rootCauseIdentified",
    header: "Root Cause ID'd",
    sortValue: (d) => d.rootCauseIdentified ?? "",
    render: (d) => d.rootCauseIdentified ?? "—",
    minWidth: "min-w-[130px]",
  },
  {
    key: "defectCategory",
    header: "Category",
    sortValue: (d) => d.defectCategory,
    render: (d) => d.defectCategory,
    minWidth: "min-w-[110px]",
  },
  {
    key: "resolutionDate",
    header: "Resolution Date",
    sortValue: (d) => d.resolutionDate ?? "",
    render: (d) => d.resolutionDate ?? "—",
    minWidth: "min-w-[130px]",
  },
  {
    key: "reworkTimeMinutes",
    header: "Rework (min)",
    sortValue: (d) => d.reworkTimeMinutes,
    render: (d) => String(d.reworkTimeMinutes),
    align: "right",
    minWidth: "min-w-[110px]",
  },
  {
    key: "status",
    header: "Status",
    sortValue: (d) => d.status,
    render: (d) => d.status,
    minWidth: "min-w-[100px]",
  },
];

