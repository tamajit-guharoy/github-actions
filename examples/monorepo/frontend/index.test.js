const { formatGreeting } = require('./index');

test('formats a greeting', () => {
  expect(formatGreeting('Alice')).toBe('Welcome, Alice!');
});
