# Contributing to Tson

Thank you for your interest in contributing to Tson! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- Git
- TypeScript knowledge

### Setup

1. Fork and clone the repository:

```bash
git clone https://github.com/yourusername/tson.git
cd tson
```

2. Install dependencies:

```bash
bun install
```

3. Run tests to verify setup:

```bash
bun test
```

## Project Structure

TBD

## Development Workflow

### Making Changes

1. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and add tests

3. Run type checking:

```bash
bun run typecheck
```

4. Run tests:

```bash
bun test
```

5. Format code:

```bash
bun run format
```

6. Lint code:

```bash
bun run lint
```

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

Examples:

```
TBD
```

### Testing

- Write tests for all new features
- Maintain or improve code coverage
- Test files use `.test.ts` extension
- Place tests alongside source files

Example test:

```typescript
TBD;
```

### Documentation

- Update documentation for user-facing changes
- Add JSDoc comments to public APIs
- Include examples in documentation
- Update CHANGELOG.md

## Code Style

### TypeScript

- Use strict TypeScript mode
- Avoid `any` types
- Prefer explicit return types
- Use meaningful variable names

### Formatting

- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters

Run formatter before committing:

```bash
bun run format
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for your changes
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Create pull request with clear description
6. Link related issues

### PR Checklist

- [ ] Tests pass
- [ ] Type checking passes
- [ ] Code is formatted
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] No linting errors

## Package-Specific Guidelines

TBD

## Performance Considerations

- Profile before optimizing
- Document performance characteristics
- Add benchmarks for significant changes
- Don't sacrifice readability for micro-optimizations

## Reporting Issues

### Bug Reports

Include:

- Tson version
- Runtime (Bun/Node version)
- Code example reproducing the issue
- Expected vs actual behavior
- Error messages/stack traces

### Feature Requests

Include:

- Use case description
- Proposed API design
- Alternative solutions considered
- Breaking change analysis

## Questions?

- Open a discussion on GitHub
- Check existing issues and PRs
- Read the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
