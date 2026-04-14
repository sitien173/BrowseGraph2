import { Controller, Get, Param, Query } from "@nestjs/common";

import { GraphResult, GraphService } from "./graph.service";

@Controller("api/v1/graph")
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get("neighborhood/:nodeId")
  async getNeighborhood(
    @Param("nodeId") nodeId: string,
    @Query("depth") depth: string | undefined,
    @Query("limit") limit: string | undefined
  ): Promise<GraphResult> {
    const parsedDepth = depth === undefined ? 2 : Number(depth);
    const parsedLimit = limit === undefined ? 200 : Number(limit);

    return this.graphService.getNeighborhood(nodeId, parsedDepth, parsedLimit);
  }

  @Get("filter")
  async getFiltered(
    @Query("tag") tag: string | undefined,
    @Query("domain") domain: string | undefined,
    @Query("type") type: string | undefined,
    @Query("session") session: string | undefined
  ): Promise<GraphResult> {
    return this.graphService.getFiltered(tag, domain, type, session);
  }
}
