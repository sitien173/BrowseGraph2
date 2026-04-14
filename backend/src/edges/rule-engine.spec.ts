import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { Neo4jService } from "../neo4j/neo4j.service";
import { RuleEngine } from "./rule-engine";

interface MockNode {
  id: string;
  normalizedUrl: string | null;
  title: string | null;
  note: string | null;
  selectedText: string | null;
  tags: string[] | null;
  domains: string[] | null;
  groups: string[] | null;
}

const createRecord = (node: MockNode): { toObject: () => MockNode } => ({
  toObject: () => node
});

const createNode = (id: string, tags: string[]): MockNode => ({
  id,
  normalizedUrl: `example.com/${id}`,
  title: null,
  note: null,
  selectedText: null,
  tags,
  domains: [],
  groups: []
});

describe("RuleEngine", () => {
  const createService = async (nodes: MockNode[], threshold: string) => {
    const neo4jService = {
      read: jest.fn().mockResolvedValue({
        records: nodes.map((node) => createRecord(node))
      }),
      write: jest.fn().mockResolvedValue({ records: [] })
    };
    const configService = {
      get: jest.fn().mockReturnValue(threshold)
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        RuleEngine,
        { provide: Neo4jService, useValue: neo4jService },
        { provide: ConfigService, useValue: configService }
      ]
    }).compile();

    return {
      ruleEngine: moduleRef.get(RuleEngine),
      neo4jService,
      configService
    };
  };

  it("writes a RELATED edge for nodes sharing a tag when the threshold is met", async () => {
    const { ruleEngine, neo4jService } = await createService(
      [createNode("a", ["neo4j"]), createNode("b", ["neo4j"])],
      "5"
    );

    await expect(
      ruleEngine.generateEdges("2026-04-14T00:00:00.000Z")
    ).resolves.toEqual({ related: 1, duplicates: 0 });

    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("RELATED"),
      expect.objectContaining({
        aId: "a",
        bId: "b",
        score: 5,
        reason: JSON.stringify(["sameTag"])
      })
    );
  });

  it("writes a DUPLICATE_OF edge for nodes with the same normalizedUrl", async () => {
    const a = createNode("a", []);
    const b = { ...createNode("b", []), normalizedUrl: a.normalizedUrl };
    const { ruleEngine, neo4jService } = await createService([a, b], "7");

    await expect(
      ruleEngine.generateEdges("2026-04-14T00:00:00.000Z")
    ).resolves.toEqual({ related: 0, duplicates: 1 });

    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("DUPLICATE_OF"),
      expect.objectContaining({
        aId: "a",
        bId: "b",
        confidence: 1.0
      })
    );
  });

  it("does not write a RELATED edge when the score is below the threshold", async () => {
    const { ruleEngine, neo4jService } = await createService(
      [createNode("a", ["neo4j"]), createNode("b", ["neo4j"])],
      "7"
    );

    await expect(
      ruleEngine.generateEdges("2026-04-14T00:00:00.000Z")
    ).resolves.toEqual({ related: 0, duplicates: 0 });

    expect(neo4jService.write).not.toHaveBeenCalledWith(
      expect.stringContaining("RELATED"),
      expect.anything()
    );
  });
});
