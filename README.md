# dw-p-limit

A library for promise-based task concurrency with exponential backoff retries, available in both TypeScript and vanilla JavaScript.

## Features

- Promise-based task concurrency limiting
- Exponential backoff retry mechanism
- Available in both TypeScript and vanilla JavaScript
- TypeScript typings included
- Zero dependencies

## Installation

```bash
npm install dw-p-limit
```

## Usage

### TypeScript (Default)

```typescript
import { pLimit, withRetry } from 'dw-p-limit';

// Basic concurrency limiting (max 2 concurrent tasks)
const limit = pLimit(2);

// Create tasks using the limit function
const task1 = limit(async () => {
  // Your async task here
  return 'result1';
});

// With retry options per task
const task2 = limit(async () => {
  // Your async task that might fail
  return 'result2';
}, {
  retries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 30000
});

// Global retry options for all tasks
const limitWithRetry = pLimit(2, {
  retry: {
    retries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    maxDelay: 30000
  }
});

// Using withRetry separately (if you want to create a retry function without concurrency control)
const retryableTask = withRetry(async () => {
  // Your async task that might fail
  return 'result3';
}, {
  retries: 3,
  initialDelay: 1000
});

// Execute tasks
const results = await Promise.all([
  task1,
  task2,
  limitWithRetry(async () => 'result3'),
  limit(() => retryableTask())  // Combining limit with a retryable task
]);
```

### Vanilla JavaScript

```javascript
// CommonJS (require)
const { pLimit, withRetry } = require('dw-p-limit').js;

// or ES modules (import)
import { js } from 'dw-p-limit';
const { pLimit, withRetry } = js;

// Then use the same API as in TypeScript
const limit = pLimit(2);

const task = limit(async () => {
  // Your async task here
  return 'result';
}, {
  retries: 3,
  initialDelay: 1000
});
```

## TypeScript vs JavaScript

This package provides both TypeScript and JavaScript implementations with identical functionality:

- The TypeScript implementation is the default export and provides type safety
- The JavaScript implementation is available under the `js` namespace
- Both can be used in either TypeScript or JavaScript projects
- Both support CommonJS (require) and ES modules (import)
- The API is identical for both implementations

## License

MIT 