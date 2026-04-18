import {
  Controller,
  Get,
  NotFoundException,
  Res,
  SetMetadata
} from "@nestjs/common";
import { FastifyReply } from "fastify";

import { IS_PUBLIC_ROUTE } from "../auth/auth.guard";
import { GraphResult } from "../graph/graph.service";
import { WebService } from "./web.service";

@Controller()
export class WebController {
  constructor(private readonly webService: WebService) {}

  @Get("api/v1/web/seed")
  async getSeedGraph(): Promise<GraphResult> {
    return this.webService.getSeedGraph();
  }

  @SetMetadata(IS_PUBLIC_ROUTE, true)
  @Get("explorer")
  async serveExplorerIndex(
    @Res({ passthrough: true }) response: FastifyReply
  ): Promise<string> {
    return this.sendExplorerIndex(response);
  }

  @SetMetadata(IS_PUBLIC_ROUTE, true)
  @Get("explorer/*")
  async serveExplorerRoute(
    @Res({ passthrough: true }) response: FastifyReply
  ): Promise<string> {
    return this.sendExplorerIndex(response);
  }

  private async sendExplorerIndex(response: FastifyReply): Promise<string> {
    const html = await this.webService.getExplorerIndexHtml();

    if (html === null) {
      throw new NotFoundException("Web explorer assets are not available");
    }

    response.type("text/html");

    return html;
  }
}
