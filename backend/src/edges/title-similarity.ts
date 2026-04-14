const tokenizeTitle = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 0)
  );

export function titleSimilarity(a: string, b: string): number {
  const aTokens = tokenizeTitle(a);
  const bTokens = tokenizeTitle(b);

  if (aTokens.size === 0 && bTokens.size === 0) {
    return 0;
  }

  const intersectionSize = [...aTokens].filter((token) =>
    bTokens.has(token)
  ).length;
  const unionSize = new Set([...aTokens, ...bTokens]).size;

  return intersectionSize / unionSize;
}
