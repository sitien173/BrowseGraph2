import { Injectable } from "@nestjs/common";

import { Neo4jService } from "../neo4j/neo4j.service";
import {
  BookmarkNode,
  SessionNode,
  TabGroupNode,
  TabNode
} from "./node.types";
import { NodeRepository } from "./node.repository";

export type SyncPayload =
  | { type: "tab"; data: TabNode }
  | { type: "bookmark"; data: BookmarkNode }
  | { type: "tabgroup"; data: TabGroupNode }
  | { type: "session"; data: SessionNode };

export interface SyncResult {
  counts: {
    tab: number;
    bookmark: number;
    tabgroup: number;
    session: number;
  };
}

type TabNodeWithPosition = TabNode & {
  position?: number;
};

@Injectable()
export class SyncService {
  constructor(
    private readonly nodeRepository: NodeRepository,
    private readonly neo4jService: Neo4jService
  ) {}

  async syncNodes(payload: SyncPayload[]): Promise<SyncResult> {
    const counts: SyncResult["counts"] = {
      tab: 0,
      bookmark: 0,
      tabgroup: 0,
      session: 0
    };

    for (const item of payload) {
      if (item.type === "tab") {
        await this.nodeRepository.upsertTab(item.data);
        await this.createStructuralEdges(item.type, item.data);
        counts.tab += 1;
      }

      if (item.type === "bookmark") {
        await this.nodeRepository.upsertBookmark(item.data);
        await this.createStructuralEdges(item.type, item.data);
        counts.bookmark += 1;
      }

      if (item.type === "tabgroup") {
        await this.nodeRepository.upsertTabGroup(item.data);
        counts.tabgroup += 1;
      }

      if (item.type === "session") {
        await this.nodeRepository.upsertSession(item.data);
        counts.session += 1;
      }
    }

    return { counts };
  }

  private async createStructuralEdges(
    nodeType: "tab" | "bookmark",
    node: TabNode | BookmarkNode
  ): Promise<void> {
    const host = new URL(`https://${node.normalizedUrl}`).hostname;
    const createdAt = node.createdAt;

    await this.neo4jService.write(
      "MATCH (n {normalizedUrl: $normalizedUrl}) MERGE (d:Domain {normalizedHost: $host}) ON CREATE SET d.host = $host, d.normalizedHost = $host, d.createdAt = $createdAt MERGE (n)-[:ON_DOMAIN {createdAt: $createdAt}]->(d)",
      { normalizedUrl: node.normalizedUrl, host, createdAt }
    );

    if (nodeType !== "tab") {
      return;
    }

    const tabNode = node as TabNodeWithPosition;

    if (tabNode.groupId !== null) {
      await this.neo4jService.write(
        "MATCH (t:Tab {normalizedUrl: $normalizedUrl}) MATCH (g:TabGroup {chromeGroupId: $groupId}) MERGE (t)-[:IN_GROUP {createdAt: $createdAt}]->(g)",
        {
          normalizedUrl: tabNode.normalizedUrl,
          groupId: tabNode.groupId,
          createdAt
        }
      );
    }

    await this.neo4jService.write(
      "MATCH (t:Tab {normalizedUrl: $normalizedUrl}) MATCH (s:Session) WHERE s.endedAt IS NULL WITH t, s ORDER BY s.startedAt DESC LIMIT 1 MERGE (s)-[r:IN_SESSION]->(t) ON CREATE SET r.position = $position, r.createdAt = $createdAt",
      {
        normalizedUrl: tabNode.normalizedUrl,
        position: tabNode.position ?? 0,
        createdAt
      }
    );
  }
}
