const TRACKING_PARAM_NAMES = new Set<string>([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "msclkid"
]);

const stripTrailingSlash = (pathname: string): string => {
  if (pathname === "/") {
    return "";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

const shouldKeepParam = (key: string): boolean => {
  const normalizedKey = key.toLowerCase();

  return (
    !normalizedKey.startsWith("utm_") &&
    !TRACKING_PARAM_NAMES.has(normalizedKey)
  );
};

export function normalizeUrl(rawUrl: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  const host = parsedUrl.hostname.replace(/^www\./i, "");
  const pathname = stripTrailingSlash(parsedUrl.pathname);
  const params = Array.from(parsedUrl.searchParams.entries())
    .filter(([key]) => shouldKeepParam(key))
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  const query = new URLSearchParams(params).toString();

  return `${host}${pathname}${query.length > 0 ? `?${query}` : ""}`;
}
