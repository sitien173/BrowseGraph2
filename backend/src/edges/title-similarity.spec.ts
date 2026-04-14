import { titleSimilarity } from "./title-similarity";

describe("titleSimilarity", () => {
  it("returns a positive score for overlapping Neo4j titles", () => {
    expect(
      titleSimilarity(
        "Getting Started with Neo4j",
        "Neo4j Getting Started Guide"
      )
    ).toBeGreaterThan(0);
  });

  it("returns 1.0 for identical strings", () => {
    expect(titleSimilarity("Same Title", "Same Title")).toBe(1.0);
  });

  it("returns 0.0 for completely different strings", () => {
    expect(titleSimilarity("Alpha Beta", "Gamma Delta")).toBe(0.0);
  });

  it("returns 0.0 for empty strings", () => {
    expect(titleSimilarity("", "")).toBe(0.0);
  });
});
