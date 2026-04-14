import { Injectable } from "@nestjs/common";

import { Neo4jService } from "../neo4j/neo4j.service";
import {
  BookmarkNode,
  DomainNode,
  SessionNode,
  TabGroupNode,
  TabNode,
  TagNode
} from "./node.types";

export interface EdgeSummary {
  type: string;
  targetId: string;
  targetLabel: string;
  targetProps: Record<string, unknown>;
  props: Record<string, unknown>;
}

export interface NodeWithEdges {
  id: string;
  node: Record<string, unknown>;
  edges: EdgeSummary[];
}

interface RawEdgeSummary {
  type: string | null;
  targetId: string | null;
  targetLabel: string | null;
  targetProps: Record<string, unknown> | null;
  props: Record<string, unknown> | null;
}

@Injectable()
export class NodeRepository {
  constructor(private readonly neo4jService: Neo4jService) {}

  async upsertTab(node: TabNode): Promise<void> {
    await this.neo4jService.write(
      "MERGE (n:Tab { normalizedUrl: $identity }) SET n += $props",
      { identity: node.normalizedUrl, props: node }
    );
  }

  async upsertBookmark(node: BookmarkNode): Promise<void> {
    await this.neo4jService.write(
      "MERGE (n:Bookmark { chromeId: $identity }) SET n += $props",
      { identity: node.chromeId, props: node }
    );
  }

  async upsertTabGroup(node: TabGroupNode): Promise<void> {
    await this.neo4jService.write(
      "MERGE (n:TabGroup { chromeGroupId: $identity }) SET n += $props",
      { identity: node.chromeGroupId, props: node }
    );
  }

  async upsertTag(node: TagNode): Promise<void> {
    await this.neo4jService.write(
      "MERGE (n:Tag { slug: $identity }) SET n += $props",
      { identity: node.slug, props: node }
    );
  }

  async upsertDomain(node: DomainNode): Promise<void> {
    await this.neo4jService.write(
      "MERGE (n:Domain { normalizedHost: $identity }) SET n += $props",
      { identity: node.normalizedHost, props: node }
    );
  }

  async upsertSession(node: SessionNode): Promise<void> {
    await this.neo4jService.write(
      "MERGE (n:Session { startedAt: $identity }) SET n += $props",
      { identity: node.startedAt, props: node }
    );
  }

  async findById(id: string): Promise<NodeWithEdges | null> {
    const result = await this.neo4jService.read(
      "MATCH (n) WHERE elementId(n) = $id OPTIONAL MATCH (n)-[r]-(m) RETURN elementId(n) AS id, properties(n) AS node, collect({type: type(r), targetId: elementId(m), targetLabel: labels(m)[0], targetProps: properties(m), props: properties(r)}) AS edges",
      { id }
    );
    return this.mapRecordToNodeWithEdges(result.records[0]);
  }

  async findByUrl(normalizedUrl: string): Promise<NodeWithEdges | null> {
    const result = await this.neo4jService.read(
      "MATCH (n:Tab { normalizedUrl: $normalizedUrl }) OPTIONAL MATCH (n)-[r]-(m) RETURN elementId(n) AS id, properties(n) AS node, collect({type: type(r), targetId: elementId(m), targetLabel: labels(m)[0], targetProps: properties(m), props: properties(r)}) AS edges",
      { normalizedUrl }
    );
    return this.mapRecordToNodeWithEdges(result.records[0]);
  }

  async findByChromeId(chromeId: string): Promise<NodeWithEdges | null> {
    const result = await this.neo4jService.read(
      "MATCH (n:Bookmark { chromeId: $chromeId }) OPTIONAL MATCH (n)-[r]-(m) RETURN elementId(n) AS id, properties(n) AS node, collect({type: type(r), targetId: elementId(m), targetLabel: labels(m)[0], targetProps: properties(m), props: properties(r)}) AS edges",
      { chromeId }
    );
    return this.mapRecordToNodeWithEdges(result.records[0]);
  }

  private mapRecordToNodeWithEdges(record: any): NodeWithEdges | null {
    if (!record) {
      return null;
    }

    const rawEdges = record.get("edges") as RawEdgeSummary[];
    const edges = rawEdges
      .filter(
        (edge) =>
          edge.type !== null &&
          edge.targetId !== null &&
          edge.targetLabel !== null &&
          edge.targetProps !== null &&
          edge.props !== null
      )
      .map((edge) => ({
        type: edge.type as string,
        targetId: edge.targetId as string,
        targetLabel: edge.targetLabel as string,
        targetProps: edge.targetProps as Record<string, unknown>,
        props: edge.props as Record<string, unknown>
      }));

    return {
      id: record.get("id") as string,
      node: record.get("node") as Record<string, unknown>,
      edges
    };
  }
}
