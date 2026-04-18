import { Injectable } from "@nestjs/common";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { Neo4jService } from "../neo4j/neo4j.service";
import { GraphResult } from "../graph/graph.service";

interface RawGraphResult {
  nodes: GraphResult["nodes"];
  edges: GraphResult["edges"];
}

const clampInteger = (value: number, minimum: number, maximum: number): number => {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
};

@Injectable()
export class WebService {
  private readonly explorerAssetCandidates = [
    resolve(process.cwd(), "dist", "web-dist"),
    resolve(process.cwd(), "web-dist")
  ];

  constructor(private readonly neo4jService: Neo4jService) {}

  async getSeedGraph(limit: number = 80): Promise<GraphResult> {
    const safeLimit = clampInteger(limit, 1, 200);
    const sessionSeedResult = await this.neo4jService.read(
      `MATCH (s:Session)
WITH s
ORDER BY s.startedAt DESC
LIMIT 1
OPTIONAL MATCH (s)-[:IN_SESSION]->(n)
WITH [node IN collect(DISTINCT n)[..$limit] WHERE node IS NOT NULL] AS seedNodes
OPTIONAL MATCH (a)-[r]-(b)
WHERE a IN seedNodes AND b IN seedNodes
RETURN [n IN seedNodes | {id: elementId(n), labels: labels(n), props: properties(n)}] AS nodes,
       [edge IN collect(DISTINCT CASE WHEN r IS NULL THEN null ELSE {id: elementId(r), type: type(r), from: elementId(startNode(r)), to: elementId(endNode(r)), props: properties(r)} END) WHERE edge IS NOT NULL] AS edges`,
      { limit: safeLimit }
    );
    const sessionSeedGraph = this.mapGraphResult(sessionSeedResult.records[0]);

    if (sessionSeedGraph.nodes.length > 0) {
      return sessionSeedGraph;
    }

    const recentSeedResult = await this.neo4jService.read(
      `MATCH (n)
WHERE n:Tab OR n:Bookmark OR n:TabGroup OR n:Tag OR n:Domain
WITH n
ORDER BY coalesce(n.lastSeenAt, n.createdAt, n.startedAt, "") DESC
LIMIT $limit
WITH collect(DISTINCT n) AS seedNodes
OPTIONAL MATCH (a)-[r]-(b)
WHERE a IN seedNodes AND b IN seedNodes
RETURN [n IN seedNodes | {id: elementId(n), labels: labels(n), props: properties(n)}] AS nodes,
       [edge IN collect(DISTINCT CASE WHEN r IS NULL THEN null ELSE {id: elementId(r), type: type(r), from: elementId(startNode(r)), to: elementId(endNode(r)), props: properties(r)} END) WHERE edge IS NOT NULL] AS edges`,
      { limit: safeLimit }
    );

    return this.mapGraphResult(recentSeedResult.records[0]);
  }

  getExplorerAssetsRoot(): string | null {
    return (
      this.explorerAssetCandidates.find((candidate) => existsSync(candidate)) ??
      null
    );
  }

  async getExplorerIndexHtml(): Promise<string | null> {
    const assetsRoot = this.getExplorerAssetsRoot();

    if (assetsRoot === null) {
      return null;
    }

    const indexPath = join(assetsRoot, "index.html");

    if (!existsSync(indexPath)) {
      return null;
    }

    return readFile(indexPath, "utf8");
  }

  private mapGraphResult(
    record: { toObject: () => unknown } | undefined
  ): GraphResult {
    if (record === undefined) {
      return { nodes: [], edges: [] };
    }

    return record.toObject() as RawGraphResult;
  }
}
