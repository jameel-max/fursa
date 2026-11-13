import { seed } from './seed';

try {
  seed();
  console.log('[seed] catalogs and demo data are ready');
  process.exit(0);
} catch (error) {
  console.error('[seed] failed', error);
  process.exit(1);
}
