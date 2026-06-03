// import { PrismaClient } from '@prisma/client';
// 
// // Construct the Prisma Client initialization function
// const prismaClientSingleton = () => {
//   return new PrismaClient({
//     log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
//   });
// };
// 
// // Declare the global scope to preserve the Prisma instance
// declare global {
//   // eslint-disable-next-line no-var
//   var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
// }
// 
// // Check if a global Prisma Client already exists, otherwise create a new instance
// const db = globalThis.prismaGlobal ?? prismaClientSingleton();
// 
const db = {};
export default db;
// 
// // Bind to globalThis in development to avoid active connection footprint issues
// // during Hot Module Replacement (HMR) cycles
// if (process.env.NODE_ENV !== 'production') {
//   globalThis.prismaGlobal = db;
// }
