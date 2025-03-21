/**
 * This file exports both the TypeScript implementation (compiled to JS)
 * and the vanilla JavaScript implementation.
 */

// TypeScript implementation (default)
const tsImplementation = require('./dist/index');

// JavaScript implementation
const jsImplementation = require('./src/js/index');

// Export TypeScript implementation as default
module.exports = tsImplementation;

// Export JavaScript implementation under a namespace
module.exports.js = jsImplementation; 