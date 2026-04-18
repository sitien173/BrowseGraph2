import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Test } from "@nestjs/testing";

import { Neo4jService } from "../neo4j/neo4j.service";
import { WebService } from "./web.service";

const createRecord = <T>(value: T): { toObject: () => T } => ({
  toObject: () => value
});

describe("WebService", () => {
  const createService = async (records: Array<{ toObject: () => unknown }>) => {
    const neo4jService = {
      read: jest.fn().mockResolvedValue({ records: [] as Array<{ toObject: () => unknown }> })
    };
    neo4jService.read
      .mockResolvedValueOnce({ records: records[0] === undefined ? [] : [records[0]] })
      .mockResolvedValueOnce({ records: records[1] === undefined ? [] : [records[1]] });

    const moduleRef = await Test.createTestingModule({
      providers: [WebService, { provide: Neo4jService, useValue: neo4jService }]
    }).compile();

    return {
      webService: moduleRef.get(WebService),
      neo4jService
    };
  };

  it("returns the most recent session graph when session data exists", async () => {
    const { webService, neo4jService } = await createService([
      createRecord({
        nodes: [{ id: "session-node", labels: ["Tab"], props: { title: "From session" } }],
        edges: []
      })
    ]);

    await expect(webService.getSeedGraph()).resolves.toEqual({
      nodes: [{ id: "session-node", labels: ["Tab"], props: { title: "From session" } }],
      edges: []
    });
    expect(neo4jService.read).toHaveBeenCalledTimes(1);
  });

  it("falls back to recent nodes when no session seed graph exists", async () => {
    const { webService, neo4jService } = await createService([
      createRecord({ nodes: [], edges: [] }),
      createRecord({
        nodes: [{ id: "recent-node", labels: ["Bookmark"], props: { title: "Recent" } }],
        edges: []
      })
    ]);

    await expect(webService.getSeedGraph()).resolves.toEqual({
      nodes: [{ id: "recent-node", labels: ["Bookmark"], props: { title: "Recent" } }],
      edges: []
    });
    expect(neo4jService.read).toHaveBeenCalledTimes(2);
  });

  it("returns an explicit empty graph when no seed candidates exist", async () => {
    const { webService } = await createService([
      createRecord({ nodes: [], edges: [] }),
      createRecord({ nodes: [], edges: [] })
    ]);

    await expect(webService.getSeedGraph()).resolves.toEqual({
      nodes: [],
      edges: []
    });
  });

  it("resolves and reads explorer index HTML when web assets are present", async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "browsegraph-web-"));
    const webDistPath = join(tempRoot, "web-dist");
    const distWebPath = join(tempRoot, "dist", "web-dist");
    const html = "<html><body>Explorer</body></html>";

    mkdirSync(webDistPath, { recursive: true });
    mkdirSync(distWebPath, { recursive: true });
    writeFileSync(join(tempRoot, "web-dist", "index.html"), html, { encoding: "utf8" });
    writeFileSync(join(tempRoot, "dist", "web-dist", "index.html"), html, { encoding: "utf8" });

    const neo4jService = {
      read: jest.fn().mockResolvedValue({ records: [] })
    };
    const moduleRef = await Test.createTestingModule({
      providers: [WebService, { provide: Neo4jService, useValue: neo4jService }]
    }).compile();
    const webService = moduleRef.get(WebService);

    (webService as unknown as { explorerAssetCandidates: string[] }).explorerAssetCandidates = [
      distWebPath,
      webDistPath
    ];

    await expect(webService.getExplorerIndexHtml()).resolves.toBe(html);
    expect(webService.getExplorerAssetsRoot()).toBe(distWebPath);

    rmSync(tempRoot, { recursive: true, force: true });
  });
});
