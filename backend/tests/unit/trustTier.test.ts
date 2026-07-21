import { trustTierForCertCount, trustTierRank } from "../../src/utils/trustTier";

describe("trustTierForCertCount", () => {
  it("returns UNVERIFIED for zero certifications", () => {
    expect(trustTierForCertCount(0)).toBe("UNVERIFIED");
  });

  it("returns STANDARD for exactly one certification", () => {
    expect(trustTierForCertCount(1)).toBe("STANDARD");
  });

  it("returns BRONZE for two or three certifications", () => {
    expect(trustTierForCertCount(2)).toBe("BRONZE");
    expect(trustTierForCertCount(3)).toBe("BRONZE");
  });

  it("returns SILVER for four or five certifications", () => {
    expect(trustTierForCertCount(4)).toBe("SILVER");
    expect(trustTierForCertCount(5)).toBe("SILVER");
  });

  it("returns GOLD for six or more certifications", () => {
    expect(trustTierForCertCount(6)).toBe("GOLD");
    expect(trustTierForCertCount(20)).toBe("GOLD");
  });
});

describe("trustTierRank", () => {
  it("ranks tiers in ascending order of trust", () => {
    const ranks = ["UNVERIFIED", "STANDARD", "BRONZE", "SILVER", "GOLD"].map((t) => trustTierRank(t as never));
    expect(ranks).toEqual([0, 1, 2, 3, 4]);
  });
});
