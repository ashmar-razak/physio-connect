import { api } from "./client";
import type {
  Application,
  Booking,
  Certification,
  CertificationType,
  ClubProfile,
  CoverRequest,
  CoverType,
  Document,
  DocumentType,
  InsuranceCoverage,
  PhysioProfile,
  RegistrationBody,
  Rating,
  TrustTier,
  Urgency,
  User,
} from "./types";

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPhysioBody {
  role: "PHYSIO";
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  bio?: string;
  locationText: string;
  travelRadiusMiles?: number;
  registrationBody: RegistrationBody;
  registrationNumber: string;
  yearsExperience?: number;
  dayRate?: number;
  sports: string[];
}

export interface RegisterClubBody {
  role: "CLUB";
  email: string;
  password: string;
  clubName: string;
  sport: string;
  contactName: string;
  contactRole?: string;
  phone?: string;
  locationText: string;
}

export const authApi = {
  register: (body: RegisterPhysioBody | RegisterClubBody) => api.post<AuthResponse>("/auth/register", body),
  login: (email: string, password: string) => api.post<AuthResponse>("/auth/login", { email, password }),
  me: () => api.get<{ user: User }>("/auth/me"),
};

export interface UpdatePhysioBody extends Partial<RegisterPhysioBody> {
  hasInsurance?: boolean;
  insurer?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  insuranceCoversPitchside?: InsuranceCoverage;
}

export interface PhysioSearchParams {
  sport?: string;
  certification?: CertificationType;
  minRating?: number;
  minTrustTier?: TrustTier;
  insuredForPitchside?: boolean;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
}

function toQueryString(params: object) {
  const parts = Object.entries(params as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export const physioApi = {
  search: (params: PhysioSearchParams = {}) => api.get<{ physios: PhysioProfile[] }>(`/physios${toQueryString(params)}`),
  detail: (id: string) => api.get<{ physio: PhysioProfile }>(`/physios/${id}`),
  me: () => api.get<{ physio: PhysioProfile }>("/physios/me"),
  updateMe: (body: UpdatePhysioBody) => api.patch<{ physio: PhysioProfile }>("/physios/me", body),
  addCertification: (body: {
    type: CertificationType;
    otherName?: string;
    issuingBody?: string;
    issueDate?: string;
    expiryDate?: string;
  }) => api.post<{ certification: Certification }>("/physios/me/certifications", body),
  updateCertification: (certId: string, body: Partial<{ type: CertificationType; otherName: string; issuingBody: string; issueDate: string; expiryDate: string }>) =>
    api.patch(`/physios/me/certifications/${certId}`, body),
  deleteCertification: (certId: string) => api.delete(`/physios/me/certifications/${certId}`),
  uploadDocument: (type: DocumentType, file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append("type", type);
    // React Native's FormData accepts a {uri, name, type} object for files;
    // this shape isn't representable in the DOM FormData typings.
    formData.append("file", file as unknown as Blob);
    return api.upload<{ document: Document }>("/physios/me/documents", formData);
  },
  deleteDocument: (documentId: string) => api.delete(`/physios/me/documents/${documentId}`),
};

export const clubApi = {
  detail: (id: string) => api.get<{ club: ClubProfile }>(`/clubs/${id}`),
  me: () => api.get<{ club: ClubProfile }>("/clubs/me"),
  updateMe: (body: Partial<RegisterClubBody>) => api.patch<{ club: ClubProfile }>("/clubs/me", body),
};

export interface CreateCoverRequestBody {
  dateNeeded: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venuePostcode: string;
  sport: string;
  ageGroup: string;
  coverType: CoverType;
  requiresDbs?: boolean;
  minCertification?: CertificationType;
  budget?: number;
  urgency?: Urgency;
  notes?: string;
}

export interface RequestSearchParams {
  status?: string;
  sport?: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
}

export const requestApi = {
  create: (body: CreateCoverRequestBody) => api.post<{ request: CoverRequest }>("/requests", body),
  search: (params: RequestSearchParams = {}) => api.get<{ requests: CoverRequest[] }>(`/requests${toQueryString(params)}`),
  mine: () => api.get<{ requests: CoverRequest[] }>("/requests/mine"),
  detail: (id: string) => api.get<{ request: CoverRequest }>(`/requests/${id}`),
  cancel: (id: string) => api.patch<{ request: CoverRequest }>(`/requests/${id}/cancel`),
  apply: (id: string, message?: string) => api.post<{ application: Application }>(`/requests/${id}/apply`, { message }),
  applications: (id: string) => api.get<{ applications: Application[] }>(`/requests/${id}/applications`),
  myApplications: () => api.get<{ applications: Application[] }>("/requests/applications/mine"),
  withdrawApplication: (applicationId: string) => api.post<{ application: Application }>(`/requests/applications/${applicationId}/withdraw`),
  acceptApplication: (applicationId: string) => api.post<{ booking: Booking }>(`/requests/applications/${applicationId}/accept`),
  declineApplication: (applicationId: string) => api.post<{ application: Application }>(`/requests/applications/${applicationId}/decline`),
};

export const bookingApi = {
  mine: () => api.get<{ bookings: Booking[] }>("/bookings/mine"),
  complete: (id: string) => api.post<{ booking: Booking }>(`/bookings/${id}/complete`),
  rate: (id: string, score: number, comment?: string) => api.post<{ rating: Rating }>(`/bookings/${id}/ratings`, { score, comment }),
  ratings: (id: string) => api.get<{ ratings: Rating[] }>(`/bookings/${id}/ratings`),
};

export const ratingsApi = {
  forUser: (userId: string) => api.get<{ ratings: Rating[]; averageRating: number | null; ratingCount: number }>(`/ratings/users/${userId}`),
};
