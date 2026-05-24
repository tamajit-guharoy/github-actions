const { add, multiply } = require('./index');

describe('add', () => {
  it('adds two numbers', () => { expect(add(2, 3)).toBe(5); });
  it('handles negatives', () => { expect(add(-1, -2)).toBe(-3); });
});

describe('multiply', () => {
  it('multiplies two numbers', () => { expect(multiply(4, 5)).toBe(20); });
  it('handles zero', () => { expect(multiply(7, 0)).toBe(0); });
});
