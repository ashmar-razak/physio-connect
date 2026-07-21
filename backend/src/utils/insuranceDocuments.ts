import { prisma } from "../db";

// Whether a physio has an uploaded INSURANCE-type document — computed
// separately from the Document relation so public endpoints (search,
// public profile, applications a club is reviewing) can factor it into
// insuranceStatus without exposing the physio's actual document list.
export async function hasInsuranceDocument(physioProfileId: string): Promise<boolean> {
  const count = await prisma.document.count({ where: { physioProfileId, type: "INSURANCE" } });
  return count > 0;
}

export async function getInsuranceDocumentSet(physioProfileIds: string[]): Promise<Set<string>> {
  if (physioProfileIds.length === 0) return new Set();

  const rows = await prisma.document.findMany({
    where: { physioProfileId: { in: physioProfileIds }, type: "INSURANCE" },
    select: { physioProfileId: true },
    distinct: ["physioProfileId"],
  });
  return new Set(rows.map((r) => r.physioProfileId));
}
