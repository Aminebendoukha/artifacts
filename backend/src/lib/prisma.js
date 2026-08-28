import prismaClientPkg from "@prisma/client";

const { PrismaClient } = prismaClientPkg;

const prisma = new PrismaClient();

export default prisma;