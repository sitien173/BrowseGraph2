import { randomBytes } from "node:crypto";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { hash, verify } from "argon2";

import { Neo4jService } from "../neo4j/neo4j.service";

type ApiKeyHashRecord = {
  hash: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly neo4jService: Neo4jService
  ) {}

  async issueKey(secret: string): Promise<{ key: string; hash: string }> {
    const expectedSecret = this.configService.getOrThrow<string>(
      "API_KEY_SECRET"
    );

    if (secret !== expectedSecret) {
      throw new UnauthorizedException("Invalid API key secret");
    }

    const key = randomBytes(32).toString("hex");
    const keyHash = await hash(key);
    const createdAt = new Date().toISOString();

    await this.neo4jService.write(
      "CREATE (k:ApiKey { hash: $hash, createdAt: $createdAt })",
      { createdAt, hash: keyHash }
    );

    return { key, hash: keyHash };
  }

  async validateKey(key: string): Promise<boolean> {
    const result = await this.neo4jService.read(
      "MATCH (k:ApiKey) RETURN k.hash AS hash",
      {}
    );

    for (const record of result.records) {
      const apiKeyHash = record.toObject() as ApiKeyHashRecord;

      if (await verify(apiKeyHash.hash, key)) {
        return true;
      }
    }

    return false;
  }
}
