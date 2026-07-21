export type Role = "PHYSIO" | "CLUB" | "ADMIN";

export const REGISTRATION_BODIES = ["HCPC", "CSP"] as const;
export type RegistrationBody = (typeof REGISTRATION_BODIES)[number];

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
export type CertificationType = (typeof CERTIFICATION_TYPES)[number];

export const CERTIFICATION_LABEL: Record<CertificationType, string> = {
  PHICIS: "PHICIS (Pitchside Head Injury)",
  ATMMIF: "ATMMiF (Trauma Medical Management)",
  RFU_PITCHSIDE: "RFU Pitchside Level",
  FIRST_AID_AT_WORK: "First Aid at Work",
  AED: "AED Trained",
  DBS_ENHANCED: "Enhanced DBS",
  DBS_BASIC: "Basic DBS",
  OTHER: "Other",
};

export const COVER_TYPES = ["MATCHDAY", "TRAINING", "ASSESSMENT", "TAPING", "TOURNAMENT", "ADVISE_ME"] as const;
export type CoverType = (typeof COVER_TYPES)[number];

export const COVER_TYPE_LABEL: Record<CoverType, string> = {
  MATCHDAY: "Matchday pitchside cover",
  TRAINING: "Training session cover",
  ASSESSMENT: "Injury assessment",
  TAPING: "Taping & strapping",
  TOURNAMENT: "Tournament / event cover",
  ADVISE_ME: "Not sure — advise me",
};

export const URGENCY_LEVELS = ["THIS_WEEKEND", "WITHIN_2_WEEKS", "ONGOING_WEEKLY", "JUST_ENQUIRING"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export const URGENCY_LABEL: Record<Urgency, string> = {
  THIS_WEEKEND: "This weekend",
  WITHIN_2_WEEKS: "Within 2 weeks",
  ONGOING_WEEKLY: "Ongoing weekly cover",
  JUST_ENQUIRING: "Just enquiring",
};

export type RequestStatus = "OPEN" | "MATCHED" | "COMPLETED" | "CANCELLED";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
export type TrustTier = "UNVERIFIED" | "STANDARD" | "BRONZE" | "SILVER" | "GOLD";

export const INSURANCE_COVERAGE = ["YES", "NO", "NOT_SURE"] as const;
export type InsuranceCoverage = (typeof INSURANCE_COVERAGE)[number];
export type InsuranceStatus = "VERIFIED" | "UNCONFIRMED" | "MISSING";

export const DOCUMENT_TYPES = ["REGISTRATION", "INSURANCE", "DBS", "PITCHSIDE_QUALIFICATION", "OTHER"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  REGISTRATION: "Proof of Registration",
  INSURANCE: "Insurance Certificate",
  DBS: "DBS Certificate",
  PITCHSIDE_QUALIFICATION: "Pitchside Qualification",
  OTHER: "Other",
};

export const DOCUMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface Certification {
  id: string;
  physioProfileId: string;
  type: CertificationType;
  otherName?: string | null;
  issuingBody?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  physioProfileId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  status: DocumentStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  uploadedAt: string;
}

export interface PhysioProfile {
  id: string;
  userId: string;
  fullName: string;
  phone?: string | null;
  bio?: string | null;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
  travelRadiusMiles: number;
  registrationBody: RegistrationBody;
  registrationNumber: string;
  registrationVerified: boolean;
  hasInsurance: boolean;
  insurer?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceExpiryDate?: string | null;
  insuranceCoversPitchside?: InsuranceCoverage | null;
  insuranceStatus: InsuranceStatus;
  yearsExperience: number;
  dayRate?: number | null;
  sports: string[];
  certifications?: Certification[];
  certificationCount: number;
  trustTier: TrustTier;
  documents?: Document[];
  averageRating: number | null;
  ratingCount: number;
  distanceMiles?: number;
  createdAt: string;
}

// What GET /admin/verification-queue and GET /admin/physios/:id return — a
// full PhysioProfile (documents always included, since the viewer is staff)
// plus their account email and a queue-relevant count.
export interface AdminPhysio extends PhysioProfile {
  email: string;
  pendingDocumentCount?: number;
}

export interface ClubProfile {
  id: string;
  userId: string;
  clubName: string;
  sport: string;
  contactName: string;
  contactRole?: string | null;
  phone?: string | null;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
  averageRating: number | null;
  ratingCount: number;
  distanceMiles?: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  physioProfile: PhysioProfile | null;
  clubProfile: ClubProfile | null;
}

export interface CoverRequest {
  id: string;
  clubProfileId: string;
  club?: ClubProfile;
  dateNeeded: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venuePostcode: string;
  sport: string;
  ageGroup: string;
  coverType: CoverType;
  requiresDbs: boolean;
  minCertification?: CertificationType | null;
  budget?: number | null;
  urgency: Urgency;
  notes?: string | null;
  status: RequestStatus;
  applicationCount?: number;
  applications?: Application[];
  distanceMiles?: number;
  createdAt: string;
}

export interface Application {
  id: string;
  coverRequestId: string;
  coverRequest?: CoverRequest;
  physioProfileId: string;
  physio?: PhysioProfile;
  status: ApplicationStatus;
  message?: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  coverRequestId: string;
  coverRequest?: CoverRequest;
  physioProfileId: string;
  physio?: PhysioProfile;
  clubProfileId: string;
  club?: ClubProfile;
  confirmedAt: string;
  completedAt?: string | null;
  ratings?: Rating[];
}

export interface Rating {
  id: string;
  bookingId: string;
  raterId: string;
  ratedId: string;
  score: number;
  comment?: string | null;
  createdAt: string;
}
