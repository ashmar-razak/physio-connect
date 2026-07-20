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
