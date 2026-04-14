import { Body, Controller, Post, SetMetadata } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { IS_PUBLIC_ROUTE } from "./auth.guard";

interface IssueKeyRequestBody {
  secret: string;
}

interface IssueKeyResponseBody {
  key: string;
}

@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SetMetadata(IS_PUBLIC_ROUTE, true)
  @Post("keys")
  async issueKey(
    @Body() body: IssueKeyRequestBody
  ): Promise<IssueKeyResponseBody> {
    const issuedKey = await this.authService.issueKey(body.secret);

    return { key: issuedKey.key };
  }
}
