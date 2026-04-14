import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Neo4jService } from "../neo4j/neo4j.service";
import { titleSimilarity } from "./title-similarity";

export interface GenerateEdgesResult {
  related: number;
  duplicates: number;
}

interface EdgeCandidateNode {
  id: string;
  normalizedUrl: string | null;
  title: string | null;
  note: string | null;
  selectedText: string | null;
  tags: string[];
  domains: string[];
  groups: string[];
}

interface EdgeScore {
  score: number;
  reason: string[];
}

interface RawEdgeCandidateNode {
  id: string;
  normalizedUrl: string | null;
  title: string | null;
  note: string | null;
  selectedText: string | null;
  tags: string[] | null;
  domains: string[] | null;
  groups: string[] | null;
}

const normalizeStringArray = (values: string[] | null): string[] =>
  values === null ? [] : values;

const toEdgeCandidateNode = (
  rawNode: RawEdgeCandidateNode
): EdgeCandidateNode => ({
  id: rawNode.id,
  normalizedUrl: rawNode.normalizedUrl,
  title: rawNode.title,
  note: rawNode.note,
  selectedText: rawNode.selectedText,
  tags: normalizeStringArray(rawNode.tags),
  domains: normalizeStringArray(rawNode.domains),
  groups: normalizeStringArray(rawNode.groups)
});

const countSharedValues = (a: string[], b: string[]): number => {
  const bValues = new Set(b);

  return [...new Set(a)].filter((value) => bValues.has(value)).length;
};

const contextSimilarity = (a: EdgeCandidateNode, b: EdgeCandidateNode): number =>
  titleSimilarity(
    `${a.note ?? ""} ${a.selectedText ?? ""}`,
    `${b.note ?? ""} ${b.selectedText ?? ""}`
  );

const scorePair = (a: EdgeCandidateNode, b: EdgeCandidateNode): EdgeScore => {
  const reason: string[] = [];
  let score = 0;
  const sharedTagCount = countSharedValues(a.tags, b.tags);

  if (sharedTagCount > 0) {
    score += 5;
    reason.push("sameTag");
  }

  if (countSharedValues(a.domains, b.domains) > 0) {
    score += 2;
    reason.push("sameDomain");
  }

  if (countSharedValues(a.groups, b.groups) > 0) {
    score += 3;
    reason.push("sameGroup");
  }

  if (titleSimilarity(a.title ?? "", b.title ?? "") > 0.2) {
    score += 3;
    reason.push("titleSim");
  }

  if (contextSimilarity(a, b) > 0.1) {
    score += 6;
    reason.push("contextSim");
  }

  return { score, reason };
};

@Injectable()
export class RuleEngine {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly configService: ConfigService
  ) {}

  async generateEdges(sinceTimestamp: string): Promise<GenerateEdgesResult> {
    const result = await this.neo4jService.read(
      "MATCH (n) WHERE (n:Tab OR n:Bookmark) AND n.createdAt >= $since RETURN elementId(n) AS id, n.normalizedUrl AS normalizedUrl, n.title AS title, n.note AS note, n.selectedText AS selectedText, [(n)-[:TAGGED_WITH]->(t:Tag) | t.slug] AS tags, [(n)-[:ON_DOMAIN]->(d:Domain) | d.normalizedHost] AS domains, [(n)-[:IN_GROUP]->(g:TabGroup) | g.chromeGroupId] AS groups",
      { since: sinceTimestamp }
    );
    const nodes = result.records.map((record) =>
      toEdgeCandidateNode(record.toObject() as RawEdgeCandidateNode)
    );
    const threshold = this.getRelatedThreshold();
    const createdAt = new Date().toISOString();
    let related = 0;
    let duplicates = 0;

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];

      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];

        if (
          a.normalizedUrl !== null &&
          b.normalizedUrl !== null &&
          a.normalizedUrl === b.normalizedUrl
        ) {
          await this.writeDuplicateEdge(a.id, b.id, createdAt);
          duplicates += 1;
        }

        const edgeScore = scorePair(a, b);

        if (edgeScore.score >= threshold) {
          await this.writeRelatedEdge(a.id, b.id, edgeScore, createdAt);
          related += 1;
        }
      }
    }

    return { related, duplicates };
  }

  private getRelatedThreshold(): number {
    const configuredThreshold =
      this.configService.get<string>("RELATED_THRESHOLD");

    if (configuredThreshold === undefined) {
      return 7;
    }

    const threshold = Number(configuredThreshold);

    if (!Number.isFinite(threshold)) {
      throw new Error("RELATED_THRESHOLD must be a finite number");
    }

    return threshold;
  }

  private async writeDuplicateEdge(
    aId: string,
    bId: string,
    createdAt: string
  ): Promise<void> {
    await this.neo4jService.write(
      "MATCH (a) WHERE elementId(a) = $aId MATCH (b) WHERE elementId(b) = $bId MERGE (a)-[r:DUPLICATE_OF]->(b) ON CREATE SET r.confidence = $confidence, r.createdAt = $createdAt ON MATCH SET r.confidence = $confidence",
      { aId, bId, confidence: 1.0, createdAt }
    );
  }

  private async writeRelatedEdge(
    aId: string,
    bId: string,
    edgeScore: EdgeScore,
    createdAt: string
  ): Promise<void> {
    await this.neo4jService.write(
      "MATCH (a) WHERE elementId(a) = $aId MATCH (b) WHERE elementId(b) = $bId MERGE (a)-[r:RELATED]-(b) ON CREATE SET r.score = $score, r.reason = $reason, r.createdAt = $createdAt ON MATCH SET r.score = $score, r.reason = $reason",
      {
        aId,
        bId,
        score: edgeScore.score,
        reason: JSON.stringify(edgeScore.reason),
        createdAt
      }
    );
  }
}
