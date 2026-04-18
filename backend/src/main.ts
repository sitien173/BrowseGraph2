import "reflect-metadata";

import fastifyStatic from "@fastify/static";
import { Logger } from "nestjs-pino";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication
} from "@nestjs/platform-fastify";

import { AppModule } from "./app.module";
import { AuthGuard } from "./auth/auth.guard";
import { WebService } from "./web/web.service";

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

  const webService = app.get(WebService);
  const explorerAssetsRoot = webService.getExplorerAssetsRoot();

  if (explorerAssetsRoot !== null) {
    await app.register(fastifyStatic, {
      root: explorerAssetsRoot,
      prefix: "/explorer/",
      wildcard: false,
      index: false,
      maxAge: 30 * 24 * 60 * 60,
      decorateReply: false
    });
  }

  await app.listen(port, host);
}

void bootstrap();
