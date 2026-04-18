import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { DiagnosticsModule } from "./diagnostics/diagnostics.module";
import { EdgesModule } from "./edges/edges.module";
import { GraphModule } from "./graph/graph.module";
import { Neo4jModule } from "./neo4j/neo4j.module";
import { NodesModule } from "./nodes/nodes.module";
import { WebModule } from "./web/web.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info"
      }
    }),
    Neo4jModule,
    NodesModule,
    EdgesModule,
    GraphModule,
    WebModule,
    DiagnosticsModule,
    AuthModule
  ],
  controllers: [AppController]
})
export class AppModule {}
