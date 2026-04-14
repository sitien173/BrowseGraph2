import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post
} from "@nestjs/common";

import { Neo4jService } from "../neo4j/neo4j.service";
import { RuleEngine } from "./rule-engine";

interface GenerateEdgesRequestBody {
  since?: string;
}

interface GenerateEdgesResponseBody {
  related: number;
  duplicates: number;
  since: string;
}

interface EdgeResponseBody {
  type: string;
  from: string;
  to: string;
  props: Record<string, unknown>;
}

interface RawEdgeRecord {
  type: string;
  props: Record<string, unknown>;
  from: string;
  to: string;
}

const oneDayAgoIso = (): string =>
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

@Controller("api/v1/edges")
export class EdgesController {
  constructor(
    private readonly ruleEngine: RuleEngine,
    private readonly neo4jService: Neo4jService
  ) {}

  @Post("generate")
  async generateEdges(
    @Body() body: GenerateEdgesRequestBody | undefined
  ): Promise<GenerateEdgesResponseBody> {
    const since = body?.since ?? oneDayAgoIso();
    const result = await this.ruleEngine.generateEdges(since);

    return { ...result, since };
  }

  @Get(":id")
  async getEdge(@Param("id") id: string): Promise<EdgeResponseBody> {
    const result = await this.neo4jService.read(
      "MATCH ()-[r]->() WHERE elementId(r) = $id RETURN type(r) AS type, properties(r) AS props, elementId(startNode(r)) AS from, elementId(endNode(r)) AS to",
      { id }
    );
    const record = result.records[0];

    if (record === undefined) {
      throw new NotFoundException(`Edge not found: ${id}`);
    }

    const edge = record.toObject() as RawEdgeRecord;

    return {
      type: edge.type,
      from: edge.from,
      to: edge.to,
      props: edge.props
    };
  }
}
