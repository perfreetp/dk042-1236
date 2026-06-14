import app from './app.js';
import dbService from './db/index.js';

async function startServer() {
  try {
    console.log('Initializing database...');
    await dbService.initDatabase();
    console.log('Database initialized successfully');

    const PORT = process.env.PORT || 3001;

    const server = app.listen(PORT, () => {
      console.log(`Server ready on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
