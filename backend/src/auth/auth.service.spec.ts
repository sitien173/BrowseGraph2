import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { Neo4jService } from "../neo4j/neo4j.service";
import { AuthService } from "./auth.service";

type MockRecord = {
  toObject: () => { hash: string };
};

describe("AuthService", () => {
  const secret = "test-secret";

  const createService = async (records: MockRecord[]) => {
    const neo4jService = {
      read: jest.fn().mockResolvedValue({ records }),
      write: jest.fn().mockResolvedValue({ records: [] })
    };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue(secret)
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: Neo4jService, useValue: neo4jService },
        { provide: ConfigService, useValue: configService }
      ]
    }).compile();

    return {
      authService: moduleRef.get(AuthService),
      neo4jService
    };
  };

  it("throws UnauthorizedException when issueKey receives the wrong secret", async () => {
    const { authService } = await createService([]);

    await expect(authService.issueKey("wrong-secret")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("returns a 64-character hex key when issueKey receives the correct secret", async () => {
    const { authService, neo4jService } = await createService([]);

    const issuedKey = await authService.issueKey(secret);

    expect(issuedKey.key).toMatch(/^[a-f0-9]{64}$/);
    expect(issuedKey.hash).not.toBe(issuedKey.key);
    expect(neo4jService.write).toHaveBeenCalledWith(
      "MERGE (k:ApiKey { createdAt: $createdAt }) SET k.hash = $hash",
      expect.objectContaining({ hash: issuedKey.hash })
    );
  });

  it("returns true for a matching stored key and false for a wrong key", async () => {
    const { authService } = await createService([]);
    const issuedKey = await authService.issueKey(secret);
    const storedRecord = {
      toObject: () => ({ hash: issuedKey.hash })
    };
    const { authService: validatingAuthService } = await createService([
      storedRecord
    ]);

    await expect(validatingAuthService.validateKey(issuedKey.key)).resolves.toBe(
      true
    );
    await expect(validatingAuthService.validateKey("wrong-key")).resolves.toBe(
      false
    );
  });
});
