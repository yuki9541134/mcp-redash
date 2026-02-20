#!/usr/bin/env node

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

// グローバルスコープにfetchが存在しない場合は追加
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

if (process.argv.includes('--streamable-http')) {
  import('./transports/streamable-http.js').then(({ startStreamableHttp }) =>
    startStreamableHttp()
  );
} else if (process.argv.includes('--sse')) {
  import('./transports/sse.js').then(({ startSSE }) => startSSE());
} else {
  import('./transports/stdio.js').then(({ startStdio }) =>
    startStdio().catch((error) => {
      console.error('Fatal error in main():', error);
      process.exit(1);
    })
  );
}
