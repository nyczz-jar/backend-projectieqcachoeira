require('dotenv').config();

const { createApp } = require('./app');
const prisma = require('./lib/prisma');

const port = Number(process.env.PORT) || 10000;
const server = createApp().listen(port, '0.0.0.0', () => {
  console.log(`IEQ Cachoeira API listening on port ${port}.`);
});

function shutdown(signal) {
  console.log(`${signal} received; shutting down the API.`);
  server.close(async (error) => {
    if (error) {
      console.error('Failed to close the HTTP server cleanly:', error);
      process.exitCode = 1;
    }

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect Prisma cleanly:', disconnectError);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));