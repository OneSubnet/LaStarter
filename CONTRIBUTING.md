# Contributing to LaStarter

Thank you for your interest in contributing to LaStarter! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Run `composer setup` for a full installation from scratch
3. Copy `.env.example` to `.env` and configure your database
4. Run `composer dev` to start the development server

## Code Style

### PHP
- Follow PSR-12 coding standards
- Run `composer run lint` to auto-fix with Pint
- Run `composer run lint:check` to check without fixing

### TypeScript / React
- Follow the existing ESLint + Prettier configuration
- Run `npm run lint` to auto-fix
- Run `npm run format` to format with Prettier
- Run `npm run types:check` to verify TypeScript types

## Branch Naming

- `feature/` — new features (e.g., `feature/extension-marketplace`)
- `fix/` — bug fixes (e.g., `fix/team-switching-redirect`)
- `docs/` — documentation changes (e.g., `docs/update-readme`)
- `refactor/` — code refactoring (e.g., `refactor/extract-actions`)

## Commit Messages

Write clear, descriptive commit messages that explain the **why** not the **what**:

```
Add extension lifecycle states for better module management

Extensions now track their state (enabled, disabled, errored, incompatible)
instead of a simple boolean. This allows better UX and error recovery.
```

## Testing

All contributions must include appropriate tests:

- **PHP tests**: Use Pest. Run `composer run test`
- **Authorization tests**: Every permission check must have a test
- **Integration tests**: Feature changes must have HTTP tests
- **Type checks**: Run `npm run types:check` — zero errors required

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Ensure all checks pass:
   - `composer run lint:check` — zero warnings
   - `composer run test` — zero failures
   - `npm run types:check` — zero errors
   - `npm run lint` — zero errors
4. Open a PR with a clear description of the change and why it's needed
5. Address review feedback

## Architecture Guidelines

- **Backend is the source of truth** — frontend only reflects state
- **Never hardcode role names** — use `hasPermissionTo()` and Policies
- **Never put business logic in controllers** — use Action classes
- **Never make DB queries in views/layouts/navigation** — resolve context upstream
- **Use Form Requests** for all non-trivial validation
- **Use the `HasTeam` trait** on all module models for auto-scoping

## Extension Contributions

Extensions are developed in separate repositories under the OneSubnet organization. Each extension must:

1. Have a valid `extension.json` manifest
2. Use a ServiceProvider extending `ModuleServiceProvider`
3. Include models with the `HasTeam` trait
4. Define permissions in the manifest
5. Include a Policy using `hasPermissionTo()`

See CLAUDE.md for the full extension development guide.

## Questions?

Open an issue on GitHub for bugs, feature requests, or questions.
