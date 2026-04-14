import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  SetMetadata
} from "@nestjs/common";

import { IS_PUBLIC_ROUTE } from "../auth/auth.guard";
import { Neo4jService } from "../neo4j/neo4j.service";

interface HealthResponseBody {
  status: "ok" | "error";
  neo4j: "connected" | "disconnected";
}

interface SyncStatusResponseBody {
  nodeCounts: Record<string, number>;
  lastSync: string | null;
}

interface RawNodeCountRecord {
  label: string | null;
  count: number | { toNumber: () => number };
}

const toNumber = (value: number | { toNumber: () => number }): number =>
  typeof value === "number" ? value : value.toNumber();

@Controller("api/v1")
export class DiagnosticsController {
  constructor(private readonly neo4jService: Neo4jService) {}

  @SetMetadata(IS_PUBLIC_ROUTE, true)
  @Get("health")
  async getHealth(): Promise<HealthResponseBody> {
    try {
      await this.neo4jService.read("RETURN 1", {});

      return { status: "ok", neo4j: "connected" };
    } catch {
      throw new HttpException(
        { status: "error", neo4j: "disconnected" },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get("diagnostics/sync-status")
  async getSyncStatus(): Promise<SyncStatusResponseBody> {
    const result = await this.neo4jService.read(
      "MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count",
      {}
    );
    const nodeCounts = result.records.reduce<Record<string, number>>(
      (counts, record) => {
        const row = record.toObject() as RawNodeCountRecord;

        if (row.label === null) {
          return counts;
        }

        return {
          ...counts,
          [row.label]: toNumber(row.count)
        };
      },
      {}
    );

    return { nodeCounts, lastSync: null };
  }
}
