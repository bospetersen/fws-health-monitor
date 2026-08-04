import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify JWT token' })
  async verify(@Body() verifyDto: { token: string }) {
    if (!verifyDto.token) {
      throw new BadRequestException('Token is required');
    }

    const payload = await this.authService.verifyToken(verifyDto.token);
    if (!payload) {
      throw new BadRequestException('Invalid or expired token');
    }

    return { valid: true, payload };
  }
}
