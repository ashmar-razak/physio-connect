// A physio's standard indemnity may not cover them when acting as a
// pitchside first aider rather than delivering physiotherapy — so "has
// insurance" alone isn't enough. VERIFIED requires both an explicit "yes it
// covers pitchside work" AND an uploaded certificate backing that claim;
// anything less is flagged for follow-up, same as the manual vetting
// checklist this app replaces (self-reported answers alone prove nothing).
export type InsuranceStatus = "VERIFIED" | "UNCONFIRMED" | "MISSING";

export function insuranceStatusFor(
  profile: { hasInsurance: boolean; insuranceCoversPitchside?: string | null },
  hasInsuranceDocument: boolean
): InsuranceStatus {
  if (!profile.hasInsurance) return "MISSING";
  if (profile.insuranceCoversPitchside === "YES" && hasInsuranceDocument) return "VERIFIED";
  return "UNCONFIRMED";
}
