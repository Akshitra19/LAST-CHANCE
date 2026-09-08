import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  const supabaseStatus = env.supabaseConfigured ? 'configured' : 'SUPABASE_CONFIG_PENDING';
  console.log(`LAST CHANCE server listening on port ${env.port} (${supabaseStatus}).`);
});
