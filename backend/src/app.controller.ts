import { Controller, Get } from "@nestjs/common";

type StatusResponse = {
  status: "ok";
};

@Controller()
export class AppController {
  @Get()
  getStatus(): StatusResponse {
    return { status: "ok" };
  }
}
