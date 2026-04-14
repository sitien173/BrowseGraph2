import "reflect-metadata";

import { Logger } from "nestjs-pino";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication
} from "@nestjs/platform-fastify";

import { AppModule } from "./app.module";
import { AuthGuard } from "./auth/auth.guard";

const port = 3000;
const host = "0.0.0.0";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true }
  );

  app.useLogger(app.get(Logger));
  app.useGlobalGuards(app.get(AuthGuard));

  await app.listen(port, host);
}

void bootstrap();
