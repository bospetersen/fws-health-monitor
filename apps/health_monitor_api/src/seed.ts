import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const authService = app.get(AuthService);

  try {
    console.log('Seeding admin user...');
    const user = await authService.createUser(
      'admin@colorworks.local',
      'mnpFR02HCicNB@N@eq5B',
      'admin',
    );
    console.log('✅ Admin user created successfully:', user.email);
  } catch (error) {
    console.log(
      'ℹ️  Admin user already exists or error:',
      error instanceof Error ? error.message : String(error),
    );
  }

  await app.close();
}

bootstrap();
