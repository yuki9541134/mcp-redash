#!/usr/bin/env node

function handleFatalError(error: unknown): void {
  console.error('Fatal error:', error);
  process.exit(1);
}

if (process.argv.includes('--streamable-http')) {
  import('./transports/streamable-http.js')
    .then(({ startStreamableHttp }) => startStreamableHttp())
    .catch(handleFatalError);
} else if (process.argv.includes('--sse')) {
  import('./transports/sse.js')
    .then(({ startSSE }) => startSSE())
    .catch(handleFatalError);
} else {
  import('./transports/stdio.js')
    .then(({ startStdio }) => startStdio())
    .catch(handleFatalError);
}
