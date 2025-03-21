# dw-p-limit Demo

This demo showcases the key features of the `dw-p-limit` library, which provides promise-based task concurrency limiting with exponential backoff retry capabilities.

## What This Demo Shows

The demo includes three main sections:

1. **Basic Concurrency Limiting**: Shows how to limit concurrent task execution to a specified number (2 in this example).

2. **Retry Mechanism**: Demonstrates the exponential backoff retry functionality by simulating a task that fails on the first attempt but succeeds on retry.

3. **Combined Features**: Showcases how to use both concurrency limiting and retry functionality together, with some tasks that succeed immediately and others that require retries.

## How to Run

### JavaScript Version
```bash
node demo.js
```

### TypeScript Version
```bash
# Compile TypeScript to JavaScript
npx tsc demo.ts

# Run the compiled JavaScript
node demo.js
```

## Example Output

When running the demo, you'll see output similar to:

```
=== BASIC CONCURRENCY LIMITING ===
Fetching data for ID: 1...
Fetching data for ID: 2...
Successfully fetched data for ID: 1
Successfully fetched data for ID: 2
Fetching data for ID: 3...
Fetching data for ID: 4...
Successfully fetched data for ID: 3
Successfully fetched data for ID: 4
Fetching data for ID: 5...
Successfully fetched data for ID: 5
Results: [
  { id: 1, data: 'Data for 1' },
  { id: 2, data: 'Data for 2' },
  { id: 3, data: 'Data for 3' },
  { id: 4, data: 'Data for 4' },
  { id: 5, data: 'Data for 5' }
]

=== RETRY MECHANISM ===
Fetching data for ID: retry-test...
Request for ID: retry-test failed!
Fetching data for ID: retry-test...
Successfully fetched data for ID: retry-test
Retry result: { id: 'retry-test', data: 'Data for retry-test' }

=== COMBINED FEATURES ===
Fetching data for ID: reliable-1...
Fetching data for ID: unreliable-1...
Successfully fetched data for ID: reliable-1
Request for ID: unreliable-1 failed!
Fetching data for ID: reliable-2...
Fetching data for ID: unreliable-1...
Successfully fetched data for ID: reliable-2
Request for ID: unreliable-1 failed!
Fetching data for ID: unreliable-2...
Fetching data for ID: unreliable-1...
Request for ID: unreliable-2 failed!
Request for ID: unreliable-1 failed!
Some tasks failed even after retries: Failed to fetch data for ID: unreliable-1
```

## Key Takeaways

1. **Concurrency Control**: Notice that tasks run in batches of 2 at a time, not all at once.

2. **Automatic Retries**: Failed tasks automatically retry with increasing delays between attempts.

3. **Failure Handling**: Tasks that exceed their retry limit will eventually throw an error, which can be caught and handled appropriately.

This demo shows how `dw-p-limit` can be used to manage concurrent API calls, network requests, or any other asynchronous operations while providing resilience through automatic retries with backoff. 