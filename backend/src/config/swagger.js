import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cybersecurity Threat Detection API",
      version: "1.0.0",
      description: "Enterprise security analytics and incident response API"
    },
    servers: [{ url: "http://localhost:5000" }]
  },
  apis: ["src/routes/*.js"]
});
