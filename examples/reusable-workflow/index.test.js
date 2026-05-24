const { greet } = require('./index');

test('greets by name', () => { expect(greet('World')).toBe('Hello, World!'); });
test('handles empty string', () => { expect(greet('')).toBe('Hello, !'); });
