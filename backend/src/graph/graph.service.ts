import { Injectable } from "@nestjs/common";

import { Neo4jService } from "../neo4j/neo4j.service";

export interface GraphNode {
  id: string;
  labels: string[];
  props: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  type: string;
  from: string;
  to: string;
  props: Record<string, unknown>;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface RawGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const clampInteger = (value: number, minimum: number, maximum: number): number => {
  if (!Number.isFinite(value)) {
    return minimum;
  }

  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
};

@Injectable()
export class GraphService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async getNeighborhood(
    nodeId: string,
    depth: number,
    limit: number
  ): Promise<GraphResult> {
    const safeDepth = clampInteger(depth, 0, 5);
    const safeLimit = clampInteger(limit, 1, 500);
    const result = await this.neo4jService.read(
      `MATCH path = (start)-[*0..${safeDepth}]-(neighbor)
WHERE elementId(start) = $nodeId
WITH collect(nodes(path)) AS nodeLists, collect(relationships(path)) AS relLists
WITH reduce(allNodes = [], ns IN nodeLists | allNodes + ns) AS nodeBag,
     reduce(allRels = [], rs IN relLists | allRels + rs) AS relBag
UNWIND nodeBag AS n
WITH collect(DISTINCT n) AS allNodes, relBag
UNWIND CASE WHEN relBag = [] THEN [null] ELSE relBag END AS r
WITH allNodes, collect(DISTINCT r) AS allRels
RETURN [n IN allNodes | {id: elementId(n), labels: labels(n), props: properties(n)}][..${safeLimit}] AS nodes,
       [r IN allRels WHERE r IS NOT NULL | {id: elementId(r), type: type(r), from: elementId(startNode(r)), to: elementId(endNode(r)), props: properties(r)}] AS edges`,
      { nodeId }
    );
    const record = result.records[0];

    if (record === undefined) {
      return { nodes: [], edges: [] };
    }

    return record.toObject() as RawGraphResult;
  }

  async getFiltered(
    tag: string | undefined,
    domain: string | undefined,
    type: string | undefined,
    session: string | undefined
  ): Promise<GraphResult> {
    const result = await this.neo4jService.read(
      `MATCH (n)
WHERE ($type IS NULL OR $type IN labels(n))
  AND ($tag IS NULL OR EXISTS { MATCH (n)-[:TAGGED_WITH]->(:Tag {slug: $tag}) })
  AND ($domain IS NULL OR EXISTS { MATCH (n)-[:ON_DOMAIN]->(:Domain {normalizedHost: $domain}) })
  AND ($session IS NULL OR EXISTS { MATCH (:Session {startedAt: $session})-[:IN_SESSION]->(n) })
WITH n LIMIT 200
OPTIONAL MATCH (n)-[r]-(m)
WITH collect(DISTINCT {id: elementId(n), labels: labels(n), props: properties(n)}) AS nodes,
     collect(DISTINCT CASE WHEN r IS NULL THEN null ELSE {id: elementId(r), type: type(r), from: elementId(startNode(r)), to: elementId(endNode(r)), props: properties(r)} END) AS edges
RETURN nodes, [edge IN edges WHERE edge IS NOT NULL] AS edges`,
      {
        tag: tag ?? null,
        domain: domain ?? null,
        type: type ?? null,
        session: session ?? null
      }
    );
    const record = result.records[0];

    if (record === undefined) {
      return { nodes: [], edges: [] };
    }

    return record.toObject() as RawGraphResult;
  }
}
