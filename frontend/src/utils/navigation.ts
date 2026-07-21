import type { Role } from "@/api/types";

// The (tabs) group has no shared "index" route (each role sees a different
// first tab), so callers must redirect to a concrete leaf route rather than
// the bare group path.
export function homeHref(
  role: Role | undefined
): "/(tabs)/physios" | "/(tabs)/jobs" | "/(tabs)/admin" | "/(tabs)/profile" {
  if (role === "CLUB") return "/(tabs)/physios";
  if (role === "PHYSIO") return "/(tabs)/jobs";
  if (role === "ADMIN") return "/(tabs)/admin";
  return "/(tabs)/profile";
}
