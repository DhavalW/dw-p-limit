/**
 * ES Module entry point for dw-p-limit
 * Exports both TypeScript and JavaScript implementations.
 */

// TypeScript implementation (default)
import * as tsImplementation from './dist/index.js';

// JavaScript implementation
import * as jsImplementation from './src/js/index.js';

// Export TypeScript implementation as default and named exports
export const { pLimit, withRetry } = tsImplementation;
export default tsImplementation;

// Export JavaScript implementation under a namespace
export const js = jsImplementation; 