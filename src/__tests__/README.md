# Testing

This project uses Jest and React Testing Library for testing.

## Running Tests

To run all tests:

```bash
npm run test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To run tests with coverage:

```bash
npm run test:coverage
```

## Test Structure

- Unit tests are located in the `src/__tests__` directory
- Test files follow the naming convention `*.test.ts` or `*.test.tsx`
- Tests are organized by component or module

## Writing Tests

When writing new tests, follow these guidelines:

1. Place test files in the `src/__tests__` directory
2. Name test files with the same name as the component/module being tested, followed by `.test.ts` or `.test.tsx`
3. Use descriptive test names that clearly indicate what is being tested
4. Test both positive and negative cases
5. Mock external dependencies when appropriate