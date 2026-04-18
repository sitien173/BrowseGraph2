import { Module } from "@nestjs/common";

import { Neo4jModule } from "../neo4j/neo4j.module";
import { WebController } from "./web.controller";
import { WebService } from "./web.service";

@Module({
  imports: [Neo4jModule],
  controllers: [WebController],
  providers: [WebService],
  exports: [WebService]
})
export class WebModule {}
