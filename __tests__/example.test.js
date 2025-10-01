// Example test file to demonstrate Jest setup
describe('Jest Configuration Test', () => {
  test('should run basic JavaScript tests', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle ES6 features', () => {
    const arrowFunction = (x) => x * 2;
    expect(arrowFunction(5)).toBe(10);
  });

  test('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });

  test('should mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should handle DOM operations', () => {
    document.body.innerHTML = '<div id="test">Hello World</div>';
    const element = document.getElementById('test');
    
    expect(element).toBeTruthy();
    expect(element.textContent).toBe('Hello World');
  });

  test('should handle window object', () => {
    expect(window).toBeDefined();
    expect(typeof window.innerWidth).toBe('number');
  });
});

