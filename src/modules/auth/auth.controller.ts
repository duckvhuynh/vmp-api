import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, TokenResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOkResponse({ type: TokenResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOkResponse({ type: TokenResponseDto })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: TokenResponseDto })
  refresh(@Req() req: any) {
    return this.auth.refresh(req.user.userId, req.user.roles);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ schema: { example: { success: true } } })
  logout() {
    // Stateless JWT: client discards tokens; maintain token blacklist if needed later
    return { success: true };
  }
}
