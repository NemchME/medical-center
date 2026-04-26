import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

(BigInt.prototype as unknown as { toJSON: () => number | string }).toJSON =
  function toJSON() {
    const n = Number(this);
    return Number.isSafeInteger(n) ? n : this.toString();
  };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.enableCors({ origin: "http://localhost:5173" });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle("medicina API")
    .setDescription("Система управления клиникой")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(3000);
  console.log("API running on http://localhost:3000");
  console.log("Swagger UI: http://localhost:3000/api/docs");
}

bootstrap();
