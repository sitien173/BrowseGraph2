import { Test } from "@nestjs/testing";

import { Neo4jService } from "../neo4j/neo4j.service";
import { GraphService } from "./graph.service";

describe("GraphService search", () => {
  const createService = async (records: Array<{ toObject: () => unknown }>) => {
    const neo4jService = {
      read: jest.fn().mockResolvedValue({ records })
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        GraphService,
        { provide: Neo4jService, useValue: neo4jService }
      ]
    }).compile();

    return {
      graphService: moduleRef.get(GraphService),
      neo4jService
    };
  };

  it("returns an empty result and skips querying when the search term is blank", async () => {
    const { graphService, neo4jService } = await createService([]);

    await expect(graphService.search("   ", 25)).resolves.toEqual({ nodes: [] });
    expect(neo4jService.read).not.toHaveBeenCalled();
  });

  it("searches title, URL, tags, and domains with a parameterized and clamped query", async () => {
    const record = {
      toObject: () => ({
        nodes: [{ id: "node-1", labels: ["Tab"], props: { title: "Neo4j Docs" } }]
      })
    };
    const { graphService, neo4jService } = await createService([record]);

    await expect(graphService.search("  Neo4J  ", 999)).resolves.toEqual({
      nodes: [{ id: "node-1", labels: ["Tab"], props: { title: "Neo4j Docs" } }]
    });
    expect(neo4jService.read).toHaveBeenCalledWith(
      expect.stringContaining("MATCH (n)"),
      expect.objectContaining({ query: "neo4j", limit: 100 })
    );
  });

  it("casts searchable and sortable fields to string to avoid runtime type failures", async () => {
    const { graphService, neo4jService } = await createService([
      {
        toObject: () => ({ nodes: [] })
      }
    ]);

    await graphService.search("Morph", 25);

    const [query] = neo4jService.read.mock.calls[0] as [string, Record<string, unknown>];
    expect(query).toContain("toLower(toString(coalesce(n.title, \"\"))) CONTAINS $query");
    expect(query).toContain(
      "ORDER BY coalesce(toString(n.lastSeenAt), toString(n.createdAt), toString(n.startedAt), \"\") DESC"
    );
  });

  it("returns an empty nodes array when Neo4j returns no records", async () => {
    const { graphService } = await createService([]);

    await expect(graphService.search("Morph", 25)).resolves.toEqual({ nodes: [] });
  });
});
