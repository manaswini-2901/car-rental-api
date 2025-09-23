import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser(process.env.SESSION_SECRET)); // <-- read signed cookies
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (validationErrors) => {
      const errors: Record<string, string> = {};
      for (const ve of validationErrors) {
        if (ve.constraints) {
          errors[ve.property] = Object.values(ve.constraints)[0];
        }
      }
      return new BadRequestException({ errors });
    },
  }));

app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Swagger API documentation setup
  const config = new DocumentBuilder()
    .setTitle('Car Rental API Documentation')
    .setDescription('Endpoints for the Car Rental backend, including users, cars, bookings, and authentication.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
