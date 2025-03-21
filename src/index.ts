interface RetryOptions {
  retries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

interface QueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  retryOptions?: RetryOptions;
}

interface LimitOptions {
  retry?: RetryOptions;
}

export function pLimit<T = any>(concurrency: number, options: LimitOptions = {}) {
  if (!(concurrency >= 1)) {
    throw new Error('Concurrency must be >= 1');
  }

  const queue: QueueItem[] = [];
  let activeCount = 0;

  const executeWithRetry = async <R>(fn: () => Promise<R>, retryOptions?: RetryOptions): Promise<R> => {
    if (!retryOptions) {
      return fn();
    }

    const {
      retries = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2
    } = retryOptions;

    if (retries === 0) {
      return fn();
    }

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt === retries) {
          throw lastError;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError!;
  };

  const next = () => {
    if (activeCount >= concurrency || queue.length === 0) {
      return;
    }

    const { fn, resolve, reject, retryOptions } = queue.shift()!;
    activeCount++;

    Promise.resolve()
      .then(() => executeWithRetry(fn, retryOptions))
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeCount--;
        next();
      });
  };

  return <R = T>(fn: () => Promise<R>, retryOptions?: RetryOptions): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      queue.push({ 
        fn, 
        resolve, 
        reject,
        retryOptions: retryOptions || options.retry
      });
      next();
    });
  };
}

export function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): () => Promise<T> {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2
  } = options;

  return async () => {
    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt === retries) {
          throw lastError;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError!;
  };
} 