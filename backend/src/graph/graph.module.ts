import { Module } from "@nestjs/common";

import { Neo4jModule } from "../neo4j/neo4j.module";
import { GraphController } from "./graph.controller";
import { GraphService } from "./graph.service";

@Module({
  imports: [Neo4jModule],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService]
})
export class GraphModule {}
