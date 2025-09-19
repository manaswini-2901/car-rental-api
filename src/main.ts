import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
// Replace the import with:
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
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
