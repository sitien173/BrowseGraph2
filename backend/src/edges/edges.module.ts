import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { Neo4jModule } from "../neo4j/neo4j.module";
import { EdgesController } from "./edges.controller";
import { RuleEngine } from "./rule-engine";

@Module({
  imports: [Neo4jModule, ConfigModule],
  controllers: [EdgesController],
  providers: [RuleEngine],
  exports: [RuleEngine]
})
export class EdgesModule {}
