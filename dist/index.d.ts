interface RetryOptions {
    retries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
}
interface LimitOptions {
    retry?: RetryOptions;
}
export declare function pLimit<T = any>(concurrency: number, options?: LimitOptions): <R = T>(fn: () => Promise<R>, retryOptions?: RetryOptions) => Promise<R>;
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): () => Promise<T>;
export {};
