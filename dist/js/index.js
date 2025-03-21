/**
 * @typedef {Object} RetryOptions
 * @property {number} [retries=3] - Maximum number of retries
 * @property {number} [initialDelay=1000] - Initial delay between retries in ms
 * @property {number} [maxDelay=30000] - Maximum delay between retries in ms
 * @property {number} [backoffFactor=2] - Factor to increase delay by after each retry
 */

/**
 * @typedef {Object} LimitOptions
 * @property {RetryOptions} [retry] - Global retry options
 */

/**
 * Creates a limit function that enforces concurrency with optional retry capabilities
 * @param {number} concurrency - Maximum number of concurrent executions
 * @param {LimitOptions} [options={}] - Options for the limit function
 * @returns {Function} The limited function wrapper
 */
function pLimit(concurrency, options = {}) {
  if (!(concurrency >= 1)) {
    throw new Error('Concurrency must be >= 1');
  }

  const queue = [];
  let activeCount = 0;

  /**
   * Executes a function with retry capability
   * @param {Function} fn - The function to execute
   * @param {RetryOptions} [retryOptions] - Options for retries
   * @returns {Promise} Promise resolving to the function's result
   */
  const executeWithRetry = async (fn, retryOptions) => {
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

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === retries) {
          throw lastError;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError;
  };

  const next = () => {
    if (activeCount >= concurrency || queue.length === 0) {
      return;
    }

    const { fn, resolve, reject, retryOptions } = queue.shift();
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

  /**
   * @param {Function} fn - The function to limit
   * @param {RetryOptions} [retryOptions] - Retry options for this specific function call
   * @returns {Promise} Promise resolving to the function's result
   */
  return (fn, retryOptions) => {
    return new Promise((resolve, reject) => {
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

/**
 * Creates a function with retry capability
 * @param {Function} fn - The function to execute with retries
 * @param {RetryOptions} [options={}] - Options for retries
 * @returns {Function} Function that retries on failure
 */
function withRetry(fn, options = {}) {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2
  } = options;

  return async () => {
    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === retries) {
          throw lastError;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError;
  };
}

module.exports = { pLimit, withRetry }; 