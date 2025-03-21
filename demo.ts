import { pLimit, withRetry } from './src/index';

// Define a type for the data
interface ApiData {
  id: string | number;
  data: string;
}

// Function to simulate an API call with a possibility of failure
const fetchData = async (id: string | number, shouldFail = false): Promise<ApiData> => {
  console.log(`Fetching data for ID: ${id}...`);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  
  if (shouldFail) {
    console.log(`Request for ID: ${id} failed!`);
    throw new Error(`Failed to fetch data for ID: ${id}`);
  }
  
  console.log(`Successfully fetched data for ID: ${id}`);
  return { id, data: `Data for ${id}` };
};

// Demo the library
async function runDemo(): Promise<void> {
  console.log('=== BASIC CONCURRENCY LIMITING ===');
  // Create a concurrency limiter that allows 2 tasks to run at once
  const limit = pLimit<ApiData>(2);
  
  // Create an array of tasks using the limiter
  const tasks: Promise<ApiData>[] = [];
  for (let i = 1; i <= 5; i++) {
    tasks.push(limit(() => fetchData(i)));
  }
  
  // Run all tasks with concurrency limiting
  const results1 = await Promise.all(tasks);
  console.log('Results:', results1);
  
  console.log('\n=== RETRY MECHANISM ===');
  // Create a task that will fail on first attempt but succeed on retry
  let attempt = 0;
  const retryableTask = withRetry<ApiData>(async () => {
    attempt++;
    return fetchData('retry-test', attempt === 1); // Fail on first attempt only
  }, {
    retries: 3,
    initialDelay: 500,
    backoffFactor: 2
  });
  
  const result2 = await retryableTask();
  console.log('Retry result:', result2);
  
  console.log('\n=== COMBINED FEATURES ===');
  // Create a limiter with global retry options
  const limitWithRetry = pLimit<ApiData>(2, {
    retry: {
      retries: 2,
      initialDelay: 500,
      backoffFactor: 2,
      maxDelay: 5000
    }
  });
  
  // Mix of reliable and unreliable tasks
  const mixedTasks = [
    limitWithRetry(() => fetchData('reliable-1')),
    limitWithRetry(() => fetchData('unreliable-1', true)), // This will fail and retry
    limitWithRetry(() => fetchData('reliable-2')),
    limitWithRetry(() => fetchData('unreliable-2', true)) // This will fail and retry
  ];
  
  try {
    const results3 = await Promise.all(mixedTasks);
    console.log('Mixed results:', results3);
  } catch (error) {
    console.error('Some tasks failed even after retries:', error instanceof Error ? error.message : String(error));
  }
}

// Run the demo
runDemo().catch(err => {
  console.error('Demo failed:', err instanceof Error ? err.message : String(err));
}); 