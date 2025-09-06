import '@testing-library/jest-dom';

// Polyfill for TextEncoder
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}