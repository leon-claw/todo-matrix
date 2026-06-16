import { app } from './app';
import { config, requireEnv } from './config';

requireEnv('DATABASE_URL');

app.listen(config.port, () => {
  console.log(`Todo Matrix API listening on http://127.0.0.1:${config.port}`);
});
