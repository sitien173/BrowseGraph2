import { Test } from "@nestjs/testing";

import { Neo4jService } from "../neo4j/neo4j.service";
import { ContextService } from "./context.service";

describe("ContextService", () => {
  const createService = async () => {
    const updatedNode = { note: "Saved note" };
    const neo4jService = {
      read: jest.fn().mockResolvedValue({
        records: [
          {
            get: jest.fn().mockReturnValue(updatedNode)
          }
        ]
      }),
      write: jest.fn().mockResolvedValue({ records: [] })
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContextService,
        { provide: Neo4jService, useValue: neo4jService }
      ]
    }).compile();

    return {
      contextService: moduleRef.get(ContextService),
      neo4jService,
      updatedNode
    };
  };

  it("creates TAGGED_WITH edges when tags are provided", async () => {
    const { contextService, neo4jService, updatedNode } = await createService();

    await expect(
      contextService.updateContext("node-id", {
        note: "Saved note",
        tags: ["Important Topic", "Read Later"]
      })
    ).resolves.toEqual(updatedNode);

    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("TAGGED_WITH"),
      expect.objectContaining({
        id: "node-id",
        tags: [
          { name: "Important Topic", slug: "important-topic" },
          { name: "Read Later", slug: "read-later" }
        ]
      })
    );
    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("SET r.source = 'user'"),
      expect.objectContaining({ id: "node-id" })
    );
  });

  it("removes all TAGGED_WITH edges when tags are empty", async () => {
    const { contextService, neo4jService } = await createService();

    await contextService.updateContext("node-id", { tags: [] });

    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("DELETE r"),
      expect.objectContaining({ id: "node-id", slugs: [] })
    );
    expect(neo4jService.write).toHaveBeenCalledWith(
      expect.stringContaining("UNWIND $tags"),
      expect.objectContaining({ id: "node-id", tags: [] })
    );
  });
});
