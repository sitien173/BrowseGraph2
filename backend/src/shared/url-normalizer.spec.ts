import { normalizeUrl } from "./url-normalizer";

describe("normalizeUrl", () => {
  it("normalizes the spec example", () => {
    expect(
      normalizeUrl("https://www.example.com/path/?utm_source=x&b=2&a=1")
    ).toBe("example.com/path?a=1&b=2");
  });

  it("sorts query params when tracking params are absent", () => {
    expect(normalizeUrl("https://example.com/foo?z=1&a=2")).toBe(
      "example.com/foo?a=2&z=1"
    );
  });

  it("strips a trailing slash", () => {
    expect(normalizeUrl("https://example.com/foo/")).toBe("example.com/foo");
  });

  it("preserves the root path as an empty suffix", () => {
    expect(normalizeUrl("https://example.com/")).toBe("example.com");
  });

  it("strips leading www", () => {
    expect(normalizeUrl("https://www.github.com/user/repo")).toBe(
      "github.com/user/repo"
    );
  });

  it("throws an Error for invalid URLs", () => {
    expect(() => normalizeUrl("not a url")).toThrow(Error);
  });
});
