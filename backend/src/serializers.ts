import type { Certification, ClubProfile, CoverRequest, Application, Booking, PhysioProfile, Rating, User } from "@prisma/client";
import { trustTierForCertCount } from "./utils/trustTier";

export function serializePhysio(
  profile: PhysioProfile & { certifications?: Certification[] },
  extras?: { averageRating?: number | null; ratingCount?: number; distanceMiles?: number }
) {
  const certCount = profile.certifications?.length ?? 0;
  return {
    id: profile.id,
    userId: profile.userId,
    fullName: profile.fullName,
    phone: profile.phone,
    bio: profile.bio,
    locationText: profile.locationText,
    latitude: profile.latitude,
    longitude: profile.longitude,
    travelRadiusMiles: profile.travelRadiusMiles,
    registrationBody: profile.registrationBody,
    registrationNumber: profile.registrationNumber,
    registrationVerified: profile.registrationVerified,
    yearsExperience: profile.yearsExperience,
    dayRate: profile.dayRate,
    sports: profile.sports ? profile.sports.split(",").filter(Boolean) : [],
    certifications: profile.certifications?.map(serializeCertification),
    certificationCount: certCount,
    trustTier: trustTierForCertCount(certCount),
    averageRating: extras?.averageRating ?? null,
    ratingCount: extras?.ratingCount ?? 0,
    distanceMiles: extras?.distanceMiles,
    createdAt: profile.createdAt,
  };
}

export function serializeClub(
  profile: ClubProfile,
  extras?: { averageRating?: number | null; ratingCount?: number; distanceMiles?: number }
) {
  return {
    id: profile.id,
    userId: profile.userId,
    clubName: profile.clubName,
    sport: profile.sport,
    contactName: profile.contactName,
    contactRole: profile.contactRole,
    phone: profile.phone,
    locationText: profile.locationText,
    latitude: profile.latitude,
    longitude: profile.longitude,
    averageRating: extras?.averageRating ?? null,
    ratingCount: extras?.ratingCount ?? 0,
    distanceMiles: extras?.distanceMiles,
    createdAt: profile.createdAt,
  };
}

export function serializeCertification(cert: Certification) {
  return {
    id: cert.id,
    physioProfileId: cert.physioProfileId,
    type: cert.type,
    otherName: cert.otherName,
    issuingBody: cert.issuingBody,
    issueDate: cert.issueDate,
    expiryDate: cert.expiryDate,
    createdAt: cert.createdAt,
  };
}

export function serializeUser(
  user: User & {
    physioProfile?: (PhysioProfile & { certifications?: Certification[] }) | null;
    clubProfile?: ClubProfile | null;
  },
  extras?: { averageRating?: number | null; ratingCount?: number }
) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    physioProfile: user.physioProfile ? serializePhysio(user.physioProfile, extras) : null,
    clubProfile: user.clubProfile ? serializeClub(user.clubProfile, extras) : null,
  };
}

export function serializeCoverRequest(
  request: CoverRequest & { clubProfile?: ClubProfile; applications?: Application[] }
) {
  return {
    id: request.id,
    clubProfileId: request.clubProfileId,
    club: request.clubProfile ? serializeClub(request.clubProfile) : undefined,
    dateNeeded: request.dateNeeded,
    startTime: request.startTime,
    endTime: request.endTime,
    venueName: request.venueName,
    venuePostcode: request.venuePostcode,
    sport: request.sport,
    ageGroup: request.ageGroup,
    coverType: request.coverType,
    requiresDbs: request.requiresDbs,
    minCertification: request.minCertification,
    budget: request.budget,
    urgency: request.urgency,
    notes: request.notes,
    status: request.status,
    applicationCount: request.applications?.length,
    createdAt: request.createdAt,
  };
}

export function serializeApplication(
  application: Application & { physioProfile?: PhysioProfile; coverRequest?: CoverRequest }
) {
  return {
    id: application.id,
    coverRequestId: application.coverRequestId,
    coverRequest: application.coverRequest ? serializeCoverRequest(application.coverRequest) : undefined,
    physioProfileId: application.physioProfileId,
    physio: application.physioProfile ? serializePhysio(application.physioProfile) : undefined,
    status: application.status,
    message: application.message,
    createdAt: application.createdAt,
  };
}

export function serializeBooking(
  booking: Booking & { physioProfile?: PhysioProfile; clubProfile?: ClubProfile; coverRequest?: CoverRequest; ratings?: Rating[] }
) {
  return {
    id: booking.id,
    coverRequestId: booking.coverRequestId,
    coverRequest: booking.coverRequest ? serializeCoverRequest(booking.coverRequest) : undefined,
    physioProfileId: booking.physioProfileId,
    physio: booking.physioProfile ? serializePhysio(booking.physioProfile) : undefined,
    clubProfileId: booking.clubProfileId,
    club: booking.clubProfile ? serializeClub(booking.clubProfile) : undefined,
    confirmedAt: booking.confirmedAt,
    completedAt: booking.completedAt,
    ratings: booking.ratings?.map(serializeRating),
  };
}

export function serializeRating(rating: Rating) {
  return {
    id: rating.id,
    bookingId: rating.bookingId,
    raterId: rating.raterId,
    ratedId: rating.ratedId,
    score: rating.score,
    comment: rating.comment,
    createdAt: rating.createdAt,
  };
}
