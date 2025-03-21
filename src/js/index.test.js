const { pLimit } = require('./index');

describe('pLimit (vanilla JS)', () => {
  it('should limit concurrent tasks', async () => {
    const limit = pLimit(2);
    const runningTasks = new Set();
    const maxConcurrent = { count: 0 };
    const results = [];

    const createTask = (id) => limit(async () => {
      runningTasks.add(id);
      maxConcurrent.count = Math.max(maxConcurrent.count, runningTasks.size);
      
      // Simulate work with random duration
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
      
      results.push(id);
      runningTasks.delete(id);
      return id;
    });

    const tasks = Array.from({ length: 6 }, (_, i) => createTask(i));
    const taskResults = await Promise.all(tasks);

    expect(results.length).toBe(6);
    expect(maxConcurrent.count).toBeLessThanOrEqual(2);
    expect(taskResults).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should handle retries with global options', async () => {
    const limit = pLimit(2, {
      retry: {
        retries: 2,
        initialDelay: 50,
        backoffFactor: 2
      }
    });

    const timings = [];
    let attempts = 0;
    let startTime;
    
    const fn = async () => {
      const now = Date.now();
      if (attempts > 0) {
        timings.push(now - startTime);
        startTime = now;
      } else {
        startTime = now;
      }
      
      attempts++;
      if (attempts <= 2) {
        throw new Error('Failed');
      }
      return 'success';
    };

    const result = await limit(fn);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
    
    // First retry should be ~50ms, second ~100ms
    expect(timings[0]).toBeGreaterThanOrEqual(40);
    expect(timings[1]).toBeGreaterThanOrEqual(90);
  });

  it('should handle per-task retry options', async () => {
    const limit = pLimit(2);
    const timings = [];
    let attempts = 0;
    let startTime;
    
    const fn = async () => {
      const now = Date.now();
      if (attempts > 0) {
        timings.push(now - startTime);
        startTime = now;
      } else {
        startTime = now;
      }
      
      attempts++;
      if (attempts <= 2) {
        throw new Error('Failed');
      }
      return 'success';
    };

    const result = await limit(fn, {
      retries: 2,
      initialDelay: 50,
      backoffFactor: 2
    });
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
    
    // First retry should be ~50ms, second ~100ms
    expect(timings[0]).toBeGreaterThanOrEqual(40);
    expect(timings[1]).toBeGreaterThanOrEqual(90);
  });

  it('should respect max delay in retries', async () => {
    const limit = pLimit(2, {
      retry: {
        retries: 3,
        initialDelay: 50,
        maxDelay: 75,
        backoffFactor: 2
      }
    });

    const timings = [];
    let attempts = 0;
    let startTime;
    
    const fn = async () => {
      const now = Date.now();
      if (attempts > 0) {
        timings.push(now - startTime);
        startTime = now;
      } else {
        startTime = now;
      }
      
      attempts++;
      if (attempts <= 3) {
        throw new Error('Failed');
      }
      return 'success';
    };

    const result = await limit(fn);
    
    expect(result).toBe('success');
    expect(attempts).toBe(4);
    
    // First retry: 50ms, second: 75ms (capped), third: 75ms (capped)
    expect(timings[0]).toBeGreaterThanOrEqual(40);
    expect(timings[1]).toBeGreaterThanOrEqual(65);
    expect(timings[2]).toBeGreaterThanOrEqual(65);
    expect(timings[1]).toBeLessThan(100); // Verify capping is working
    expect(timings[2]).toBeLessThan(100); // Verify capping is working
  });
}); 