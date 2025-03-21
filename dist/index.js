"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pLimit = pLimit;
exports.withRetry = withRetry;
function pLimit(concurrency, options = {}) {
    if (!(concurrency >= 1)) {
        throw new Error('Concurrency must be >= 1');
    }
    const queue = [];
    let activeCount = 0;
    const executeWithRetry = async (fn, retryOptions) => {
        if (!retryOptions) {
            return fn();
        }
        const { retries = 3, initialDelay = 1000, maxDelay = 30000, backoffFactor = 2 } = retryOptions;
        if (retries === 0) {
            return fn();
        }
        let lastError;
        let delay = initialDelay;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
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
function withRetry(fn, options = {}) {
    const { retries = 3, initialDelay = 1000, maxDelay = 30000, backoffFactor = 2 } = options;
    return async () => {
        let lastError;
        let delay = initialDelay;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
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
