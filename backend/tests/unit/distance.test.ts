import { haversineMiles } from "../../src/utils/distance";

describe("haversineMiles", () => {
  it("is zero for identical coordinates", () => {
    const point = { latitude: 53.4808, longitude: -2.2426 };
    expect(haversineMiles(point, point)).toBeCloseTo(0, 5);
  });

  it("is symmetric", () => {
    const a = { latitude: 53.4808, longitude: -2.2426 };
    const b = { latitude: 53.8008, longitude: -1.5491 };
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 10);
  });

  it("matches the well-known ~69 miles per degree of latitude", () => {
    const a = { latitude: 51.5, longitude: 0 };
    const b = { latitude: 52.5, longitude: 0 };
    expect(haversineMiles(a, b)).toBeGreaterThan(68);
    expect(haversineMiles(a, b)).toBeLessThan(70);
  });
});
