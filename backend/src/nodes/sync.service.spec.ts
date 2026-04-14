import { Test } from "@nestjs/testing";

import { Neo4jService } from "../neo4j/neo4j.service";
import { NodeRepository } from "./node.repository";
import { BookmarkNode, TabNode } from "./node.types";
import { SyncPayload, SyncService } from "./sync.service";

const createTab = (normalizedUrl: string): TabNode => ({
  url: `https://${normalizedUrl}`,
  normalizedUrl,
  title: "Example tab",
  status: "complete",
  windowId: 1,
  groupId: null,
  createdAt: "2026-04-14T00:00:00.000Z",
  lastSeenAt: "2026-04-14T00:00:00.000Z",
  embedding: null
});

const createBookmark = (normalizedUrl: string): BookmarkNode => ({
  chromeId: normalizedUrl,
  url: `https://${normalizedUrl}`,
  normalizedUrl,
  title: "Example bookmark",
  folderPath: "Bookmarks Bar",
  createdAt: "2026-04-14T00:00:00.000Z",
  embedding: null
});

describe("SyncService", () => {
  const createService = async () => {
    const nodeRepository = {
      upsertTab: jest.fn().mockResolvedValue(undefined),
      upsertBookmark: jest.fn().mockResolvedValue(undefined),
      upsertTabGroup: jest.fn().mockResolvedValue(undefined),
      upsertSession: jest.fn().mockResolvedValue(undefined)
    };
    const neo4jService = {
      read: jest.fn().mockResolvedValue({ records: [] }),
      write: jest.fn().mockResolvedValue({ records: [] })
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: NodeRepository, useValue: nodeRepository },
        { provide: Neo4jService, useValue: neo4jService }
      ]
    }).compile();

    return {
      syncService: moduleRef.get(SyncService),
      nodeRepository,
      neo4jService
    };
  };

  it("syncs two tabs and one bookmark with matching counts", async () => {
    const { syncService } = await createService();
    const payload: SyncPayload[] = [
      { type: "tab", data: createTab("example.com/a") },
      { type: "tab", data: createTab("example.com/b") },
      { type: "bookmark", data: createBookmark("example.com/c") }
    ];

    await expect(syncService.syncNodes(payload)).resolves.toEqual({
      counts: {
        tab: 2,
        bookmark: 1,
        tabgroup: 0,
        session: 0
      }
    });
  });

  it("calls upsert when the same node is re-synced", async () => {
    const { syncService, nodeRepository } = await createService();
    const payload: SyncPayload[] = [
      { type: "tab", data: createTab("example.com/a") }
    ];

    await syncService.syncNodes(payload);
    await syncService.syncNodes(payload);

    expect(nodeRepository.upsertTab).toHaveBeenCalledTimes(2);
  });

  it("creates structural edges for tabs and bookmarks", async () => {
    const { syncService, neo4jService } = await createService();
    const payload: SyncPayload[] = [
      { type: "tab", data: createTab("example.com/a") },
      { type: "bookmark", data: createBookmark("example.com/b") }
    ];

    await syncService.syncNodes(payload);

    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("ON_DOMAIN"),
      expect.objectContaining({ normalizedUrl: "example.com/a" })
    );
    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("IN_SESSION"),
      expect.objectContaining({ normalizedUrl: "example.com/a" })
    );
    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("ON_DOMAIN"),
      expect.objectContaining({ normalizedUrl: "example.com/b" })
    );
  });
});
