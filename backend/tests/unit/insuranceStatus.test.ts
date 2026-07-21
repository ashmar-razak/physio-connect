import { insuranceStatusFor } from "../../src/utils/insuranceStatus";

describe("insuranceStatusFor", () => {
  it("is MISSING when the physio has no insurance on file, regardless of documents", () => {
    expect(insuranceStatusFor({ hasInsurance: false, insuranceCoversPitchside: "YES" }, true)).toBe("MISSING");
    expect(insuranceStatusFor({ hasInsurance: false, insuranceCoversPitchside: null }, false)).toBe("MISSING");
  });

  it("is UNCONFIRMED when insured but coverage isn't an explicit YES", () => {
    expect(insuranceStatusFor({ hasInsurance: true, insuranceCoversPitchside: "NOT_SURE" }, true)).toBe("UNCONFIRMED");
    expect(insuranceStatusFor({ hasInsurance: true, insuranceCoversPitchside: "NO" }, true)).toBe("UNCONFIRMED");
    expect(insuranceStatusFor({ hasInsurance: true, insuranceCoversPitchside: null }, true)).toBe("UNCONFIRMED");
  });

  it("is UNCONFIRMED when coverage is YES but no approved document exists yet", () => {
    expect(insuranceStatusFor({ hasInsurance: true, insuranceCoversPitchside: "YES" }, false)).toBe("UNCONFIRMED");
  });

  it("is VERIFIED only when coverage is an explicit YES AND an approved document exists", () => {
    expect(insuranceStatusFor({ hasInsurance: true, insuranceCoversPitchside: "YES" }, true)).toBe("VERIFIED");
  });
});
