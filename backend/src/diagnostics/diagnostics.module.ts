import { Module } from "@nestjs/common";

import { Neo4jModule } from "../neo4j/neo4j.module";
import { DiagnosticsController } from "./diagnostics.controller";

@Module({
  imports: [Neo4jModule],
  controllers: [DiagnosticsController]
})
export class DiagnosticsModule {}
