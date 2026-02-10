import app from './app';
import { config } from './config';
import { startTranscodeWorker } from './services/queue.service';

app.listen(config.port, () => {
  console.log(`[WebPhim BE] Server running on port ${config.port} (${config.nodeEnv})`);

  // Start background transcode worker
  const worker = startTranscodeWorker();
  console.log('[WebPhim BE] Transcode worker started (concurrency: 1)');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[WebPhim BE] Shutting down...');
    await worker.close();
    process.exit(0);
  });
});
