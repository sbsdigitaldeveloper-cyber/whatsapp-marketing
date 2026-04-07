import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

const prismaClientSingleton = () => {
  const adapter = new PrismaMssql({
    server: "192.168.0.200",
    port: 1433,
    database: "WhatsAppMarketing",
    authentication: {
      type: "default",
      options: {
        userName: "admin",
        password: "admin@pns123",
      },
    },
    options: {
      trustServerCertificate: true,
      encrypt: false,
    },
  });

  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
