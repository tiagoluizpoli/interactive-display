import { env, setupApp } from './config';

const { port } = env.baseConfig.api;

const init = async () => {
  const app = setupApp();

  const server = app.listen(port, () => {
    console.log(`API server is running on port ${port}`);
  });

  process.on('SIGINT', () => {
    server.close(() => {
      console.log('API server closed');
      process.exit(0);
    });
  });
};

init().catch(console.error);
