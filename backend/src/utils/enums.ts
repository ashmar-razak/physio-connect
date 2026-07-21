import { z } from "zod";

export const ROLES = ["PHYSIO", "CLUB"] as const;
export const roleSchema = z.enum(ROLES);

export const REGISTRATION_BODIES = ["HCPC", "CSP"] as const;
export const registrationBodySchema = z.enum(REGISTRATION_BODIES);

export const CERTIFICATION_TYPES = [
  "PHICIS",
  "ATMMIF",
  "RFU_PITCHSIDE",
  "FIRST_AID_AT_WORK",
  "AED",
  "DBS_ENHANCED",
  "DBS_BASIC",
  "OTHER",
] as const;
export const certificationTypeSchema = z.enum(CERTIFICATION_TYPES);

export const COVER_TYPES = [
  "MATCHDAY",
  "TRAINING",
  "ASSESSMENT",
  "TAPING",
  "TOURNAMENT",
  "ADVISE_ME",
] as const;
export const coverTypeSchema = z.enum(COVER_TYPES);

export const URGENCY_LEVELS = [
  "THIS_WEEKEND",
  "WITHIN_2_WEEKS",
  "ONGOING_WEEKLY",
  "JUST_ENQUIRING",
] as const;
export const urgencySchema = z.enum(URGENCY_LEVELS);

export const REQUEST_STATUSES = ["OPEN", "MATCHED", "COMPLETED", "CANCELLED"] as const;
export const APPLICATION_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;

// Certifications that count toward "credentialed for under-18s" checks.
export const DBS_TYPES = ["DBS_ENHANCED", "DBS_BASIC"] as const;

export const INSURANCE_COVERAGE = ["YES", "NO", "NOT_SURE"] as const;
export const insuranceCoverageSchema = z.enum(INSURANCE_COVERAGE);

export const DOCUMENT_TYPES = ["REGISTRATION", "INSURANCE", "DBS", "PITCHSIDE_QUALIFICATION", "OTHER"] as const;
export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

export const DOCUMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const documentStatusSchema = z.enum(DOCUMENT_STATUSES);

// ADMIN is intentionally excluded from ROLES — it's never selectable at
// registration, only seeded/provisioned directly. AccountRole is the wider
// type used for JWTs and auth middleware, which do need to recognize it.
export type AccountRole = (typeof ROLES)[number] | "ADMIN";
