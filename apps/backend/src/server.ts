import { env, setupExpressApp } from './config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import express from 'express';
import { setupSocketIoHooks } from './io-hooks';
import { router } from './routes';
import { makePresentations } from '@/present-factory';
import type { LocalPersistence } from '@/presentations';

const { port, cors } = env.baseConfig.api;

const app = express();

setupExpressApp(app);
app.use(router);

export const server = createServer(app);

export const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: cors.origin,
  },
});

let presentations: LocalPersistence;

const init = async () => {
  presentations = await makePresentations();
  setupSocketIoHooks(io, presentations);

  const expressServer = server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  process.on('SIGINT', () => {
    expressServer.close(() => {
      presentations.destroy();
      io.close(() => {
        console.log('Socket server closed');
      });

      console.log('API server closed');

      process.exit(0);
    });
  });
};

init()
  .then(async () => {
    // setInterval(() => {
    //   const memory = process.memoryUsage();
    //   console.log(`Memória: heapUsed: ${Math.round(memory.heapUsed / 1024 / 1024)} MB`);
    //   const cpu = process.cpuUsage();
    //   console.log(`CPU: user: ${cpu.user}, system: ${cpu.system}`);
    // }, 5000);

    let lastCpuUsage = process.cpuUsage();
    let lastTime = process.hrtime.bigint(); // Usa hrtime para maior precisão

    setInterval(() => {
      // --- Valores Atuais ---
      const memory = process.memoryUsage();
      const currentCpuUsage = process.cpuUsage();
      const currentTime = process.hrtime.bigint();

      // --- 1. Cálculo do Tempo Decorrido (em microssegundos) ---
      // hrtime retorna nanossegundos, dividimos por 1000 para microssegundos
      const elapsedTime = Number(currentTime - lastTime) / 1000;

      // --- 2. Cálculo da Diferença de CPU (em microssegundos) ---
      const userDiff = currentCpuUsage.user - lastCpuUsage.user;
      const systemDiff = currentCpuUsage.system - lastCpuUsage.system;
      const totalCpuDiff = userDiff + systemDiff;

      // --- 3. Cálculo do Percentual ---
      // Divide a diferença de CPU pelo tempo decorrido
      const cpuPercent = (totalCpuDiff / elapsedTime) * 100;

      // --- Saída formatada ---
      console.log(`Memória: heapUsed: ${Math.round(memory.heapUsed / 1024 / 1024)} MB`);
      console.log(`CPU: ${cpuPercent.toFixed(2)}% (User: ${userDiff}μs, System: ${systemDiff}μs)`);

      // --- Atualiza os valores para a próxima iteração ---
      lastCpuUsage = currentCpuUsage;
      lastTime = currentTime;
    }, 2000);
    await presentations.execute();
  })
  .catch(console.error);
