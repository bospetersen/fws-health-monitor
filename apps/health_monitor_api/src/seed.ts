import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const authService = app.get(AuthService);
  const endpointGroupModel = app.get(getModelToken('EndpointGroup'));
  const endpointModel = app.get(getModelToken('Endpoint'));

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

  // Seed endpoint groups and endpoints
  try {
    console.log('\nSeeding endpoint groups and endpoints...');

    // Create groups
    const loginGroup = await endpointGroupModel.create({
      name: '🔐 Login Screens',
      active: true,
      sortOrder: 1,
    });
    console.log('✅ Created "Login Screens" group');

    const apiGroup = await endpointGroupModel.create({
      name: '📚 API Documentation (Swagger)',
      active: true,
      sortOrder: 2,
    });
    console.log('✅ Created "API Documentation" group');

    // Login Screens endpoints
    const loginEndpoints = [
      {
        name: 'Admin Portal',
        url: 'https://localhost:5176',
        description: 'Admin system dashboard and management portal',
        groupId: loginGroup._id,
        active: true,
        sortOrder: 1,
      },
      {
        name: 'Colorworks App',
        url: 'https://localhost:5173',
        description: 'Color design and management application',
        groupId: loginGroup._id,
        active: true,
        sortOrder: 2,
      },
      {
        name: 'Developer Portal',
        url: 'https://localhost:5174',
        description: 'Developer tools and API management',
        groupId: loginGroup._id,
        active: true,
        sortOrder: 3,
      },
      {
        name: 'App Store',
        url: 'https://localhost:5175',
        description: 'Mobile app store interface',
        groupId: loginGroup._id,
        active: true,
        sortOrder: 4,
      },
      {
        name: 'Collaboration Platform',
        url: 'http://localhost:3000',
        description: 'Real-time collaboration and communication',
        groupId: loginGroup._id,
        active: true,
        sortOrder: 5,
      },
      {
        name: 'Global Authenticator',
        url: 'https://localhost:3301/auth/login',
        description: 'Global authentication and user management',
        groupId: loginGroup._id,
        active: true,
        sortOrder: 6,
      },
    ];

    // API Documentation endpoints
    const apiEndpoints = [
      {
        name: 'Colorworks API',
        url: 'http://localhost:3330/api',
        description: 'Color projects and management API',
        groupId: apiGroup._id,
        active: true,
        sortOrder: 1,
      },
      {
        name: 'Collaboration API',
        url: 'http://localhost:3002/api',
        description: 'Real-time collaboration features API',
        groupId: apiGroup._id,
        active: true,
        sortOrder: 2,
      },
      {
        name: 'Developer API',
        url: 'https://localhost:3003/api',
        description: 'Developer tools and integrations API',
        groupId: apiGroup._id,
        active: true,
        sortOrder: 3,
      },
      {
        name: 'Global Authenticator API',
        url: 'https://localhost:3301/api',
        description: 'Authentication and user management API',
        groupId: apiGroup._id,
        active: true,
        sortOrder: 4,
      },
    ];

    // Insert all endpoints
    await endpointModel.insertMany([...loginEndpoints, ...apiEndpoints]);
    console.log(`✅ Created ${loginEndpoints.length + apiEndpoints.length} endpoints`);
    console.log('   - 6 Login Screens endpoints');
    console.log('   - 4 API Documentation endpoints');
  } catch (error) {
    console.log(
      'ℹ️  Endpoints already exist or error:',
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log('\n✅ Seeding completed!\n');
  await app.close();
}

bootstrap();
