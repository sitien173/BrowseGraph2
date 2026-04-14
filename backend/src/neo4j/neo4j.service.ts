import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import neo4j, { Driver, QueryResult } from "neo4j-driver";

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  private readonly driver: Driver;

  constructor(private readonly configService: ConfigService) {
    const uri = this.configService.getOrThrow<string>("NEO4J_URI");
    const user = this.configService.getOrThrow<string>("NEO4J_USER");
    const password = this.configService.getOrThrow<string>("NEO4J_PASSWORD");

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  async read(
    cypher: string,
    params: Record<string, unknown>
  ): Promise<QueryResult> {
    const session = this.driver.session({
      defaultAccessMode: neo4j.session.READ
    });

    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  async write(
    cypher: string,
    params: Record<string, unknown>
  ): Promise<QueryResult> {
    const session = this.driver.session({
      defaultAccessMode: neo4j.session.WRITE
    });

    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.driver.close();
  }
}
