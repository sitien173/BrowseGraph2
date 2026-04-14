import { Module } from "@nestjs/common";

import { ContextService } from "./context.service";
import { NodeRepository } from "./node.repository";
import { NodesController } from "./nodes.controller";
import { SyncService } from "./sync.service";

@Module({
  controllers: [NodesController],
  providers: [NodeRepository, SyncService, ContextService],
  exports: [NodeRepository, SyncService]
})
export class NodesModule {}
