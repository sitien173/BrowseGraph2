import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";

import {
  ContextService,
  UpdateContextPayload
} from "./context.service";
import { NodeRepository, NodeWithEdges } from "./node.repository";
import { SyncPayload, SyncService } from "./sync.service";

interface SyncRequestBody {
  nodes: SyncPayload[];
}

interface SyncResponseBody {
  synced: {
    tab: number;
    bookmark: number;
    tabgroup: number;
    session: number;
  };
  timestamp: string;
}

@Controller("api/v1/nodes")
export class NodesController {
  constructor(
    private readonly syncService: SyncService,
    private readonly contextService: ContextService,
    private readonly nodeRepository: NodeRepository
  ) {}

  @Post("sync")
  async syncNodes(@Body() body: SyncRequestBody): Promise<SyncResponseBody> {
    const result = await this.syncService.syncNodes(body.nodes);

    return {
      synced: result.counts,
      timestamp: new Date().toISOString()
    };
  }

  @Patch(":id/context")
  async updateContext(
    @Param("id") id: string,
    @Body() body: UpdateContextPayload
  ): Promise<Record<string, unknown> | null> {
    return this.contextService.updateContext(id, body);
  }

  @Get("by-url")
  async findByUrl(
    @Query("url") url: string
  ): Promise<NodeWithEdges | null> {
    return this.nodeRepository.findByUrl(url);
  }

  @Get("by-chrome-id")
  async findByChromeId(
    @Query("id") id: string
  ): Promise<NodeWithEdges | null> {
    return this.nodeRepository.findByChromeId(id);
  }

  @Get(":id")
  async findById(@Param("id") id: string): Promise<NodeWithEdges | null> {
    return this.nodeRepository.findById(id);
  }
}
