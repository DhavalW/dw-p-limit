import { pLimit } from './index';

describe('pLimit', () => {
  it('should limit concurrent tasks', async () => {
    const limit = pLimit(2);
    const runningTasks = new Set();
    const maxConcurrent = { count: 0 };
    const results: number[] = [];

    const createTask = (id: number) => limit(async () => {
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

    const timings: number[] = [];
    let attempts = 0;
    let startTime: number;
    
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
    const timings: number[] = [];
    let attempts = 0;
    let startTime: number;
    
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

    const timings: number[] = [];
    let attempts = 0;
    let startTime: number;
    
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

  it('should handle concurrent tasks with different retry settings', async () => {
    const limit = pLimit(2);
    const runningTasks = new Set();
    const maxConcurrent = { count: 0 };
    const taskCompletionOrder: string[] = [];
    
    // Track when each task is running
    const taskRunning = {
      task1: false,
      task2: false,
      task3: false
    };

    // Task 1: No retries
    const task1 = limit(async () => {
      taskRunning.task1 = true;
      runningTasks.add('task1');
      maxConcurrent.count = Math.max(maxConcurrent.count, runningTasks.size);
      
      await new Promise(resolve => setTimeout(resolve, 75));
      
      taskCompletionOrder.push('task1');
      runningTasks.delete('task1');
      taskRunning.task1 = false;
      return 'task1-result';
    });

    // Task 2: With retries
    let task2Attempts = 0;
    const task2 = limit(async () => {
      taskRunning.task2 = true;
      runningTasks.add('task2');
      maxConcurrent.count = Math.max(maxConcurrent.count, runningTasks.size);
      
      task2Attempts++;
      if (task2Attempts <= 2) {
        runningTasks.delete('task2');
        taskRunning.task2 = false;
        throw new Error('Task 2 Failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      taskCompletionOrder.push('task2');
      runningTasks.delete('task2');
      taskRunning.task2 = false;
      return 'task2-result';
    }, {
      retries: 2,
      initialDelay: 30
    });

    // Task 3: No retries
    const task3 = limit(async () => {
      taskRunning.task3 = true;
      runningTasks.add('task3');
      maxConcurrent.count = Math.max(maxConcurrent.count, runningTasks.size);
      
      await new Promise(resolve => setTimeout(resolve, 40));
      
      taskCompletionOrder.push('task3');
      runningTasks.delete('task3');
      taskRunning.task3 = false;
      return 'task3-result';
    });

    const results = await Promise.all([task1, task2, task3]);
    
    expect(results).toEqual(['task1-result', 'task2-result', 'task3-result']);
    expect(maxConcurrent.count).toBeLessThanOrEqual(2);
    expect(task2Attempts).toBe(3);
  });

  it('should handle zero retries correctly', async () => {
    const limit = pLimit(2, {
      retry: {
        retries: 0
      }
    });

    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error('Failed');
    };

    await expect(limit(fn)).rejects.toThrow('Failed');
    expect(attempts).toBe(1);
  });

  it('should handle high concurrency values', async () => {
    const limit = pLimit(50);
    const runningTasks = new Set();
    const maxConcurrent = { count: 0 };
    
    const tasks = Array.from({ length: 100 }, (_, i) => 
      limit(async () => {
        runningTasks.add(i);
        maxConcurrent.count = Math.max(maxConcurrent.count, runningTasks.size);
        await new Promise(resolve => setTimeout(resolve, 10));
        runningTasks.delete(i);
        return i;
      })
    );

    await Promise.all(tasks);
    expect(maxConcurrent.count).toBeLessThanOrEqual(50);
    expect(maxConcurrent.count).toBeGreaterThan(25); // Verify high concurrency
  });

  it('should handle various error types', async () => {
    const limit = pLimit(2, {
      retry: {
        retries: 2,
        initialDelay: 20
      }
    });

    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts === 1) throw new Error('Standard error');
      if (attempts === 2) throw new CustomError('Custom error');
      if (attempts === 3) throw new TypeError('Type error');
      return 'success';
    };

    await expect(limit(fn)).rejects.toThrow('Type error');
    expect(attempts).toBe(3);
  });

  it('should handle backoff factor correctly', async () => {
    const limit = pLimit(1, {
      retry: {
        retries: 3,
        initialDelay: 20,
        backoffFactor: 3,
        maxDelay: 1000
      }
    });

    const timings: number[] = [];
    let attempts = 0;
    let startTime: number;
    
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
    
    // Delays should follow the pattern: ~20ms, ~60ms, ~180ms
    expect(timings[0]).toBeGreaterThanOrEqual(15);
    expect(timings[1]).toBeGreaterThanOrEqual(50);
    expect(timings[2]).toBeGreaterThanOrEqual(170);
    
    // Check that backoff factor is working
    expect(timings[1] / timings[0]).toBeGreaterThanOrEqual(2.5);
    expect(timings[2] / timings[1]).toBeGreaterThanOrEqual(2.5);
  });

  it('should manage queue under load', async () => {
    const limit = pLimit<number>(2);
    const completionOrder: number[] = [];
    const startTimes: Map<number, number> = new Map();
    
    // Create 10 tasks with different durations
    const tasks = Array.from({ length: 10 }, (_, i) => {
      // Add tasks with staggered scheduling to ensure queue management
      return new Promise<number>((resolve) => {
        setTimeout(() => {
          startTimes.set(i, Date.now());
          
          limit(async () => {
            // Tasks with even numbers take longer
            const duration = i % 2 === 0 ? 50 : 20;
            await new Promise(r => setTimeout(r, duration));
            completionOrder.push(i);
            return i;
          }).then(resolve);
        }, i * 10);
      });
    });

    await Promise.all(tasks);
    
    // Verify odd-numbered tasks (faster ones) generally finish earlier
    // than their even-numbered counterparts that started before them
    let fastTasksCompletedEarlier = false;
    for (let i = 1; i < completionOrder.length; i++) {
      const current = completionOrder[i];
      const prev = completionOrder[i-1];
      
      if (current % 2 === 1 && prev % 2 === 0 && startTimes.get(current)! > startTimes.get(prev)!) {
        fastTasksCompletedEarlier = true;
        break;
      }
    }
    
    expect(fastTasksCompletedEarlier).toBe(true);
    expect(completionOrder.length).toBe(10);
  });
}); 