import type { DOCUMENT_TYPES } from "./enums";

export const DOCUMENT_TYPE_LABEL: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  REGISTRATION: "Proof of Registration",
  INSURANCE: "Insurance Certificate",
  DBS: "DBS Certificate",
  PITCHSIDE_QUALIFICATION: "Pitchside Qualification",
  OTHER: "document",
};
