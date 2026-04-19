# LaStarter

**Modular multi-tenant platform core built with Laravel, React, and TypeScript.**

![Laravel](https://img.shields.io/badge/Laravel-13-red)
![React](https://img.shields.io/badge/React-19-blue)
![Inertia](https://img.shields.io/badge/Inertia-3-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Multi-tenancy** — Team-based organizations with automatic data isolation via global scopes
- **Dynamic roles & permissions** — Spatie permission system in teams mode, no hardcoded role checks
- **Extension system** — Modules, themes, and language packs with marketplace integration
- **Theme overrides** — 3-level page resolution: theme → module → core
- **Context-aware navigation** — Sidebar built from enabled extension manifests, filtered by permissions
- **Type-safe routes** — Wayfinder auto-generates TypeScript route helpers from PHP routes
- **Audit logging** — Track sensitive actions with team context, user, and trace IDs

## Requirements

- PHP 8.3+
- Node.js 22+
- SQLite, MySQL 8+, MariaDB 10.3+, or PostgreSQL 14+

## Quick Start

```bash
# Clone the repository
git clone https://github.com/OneSubnet/lastarter.git
cd lastarter

# Full setup (install dependencies, create .env, generate key, run migrations)
composer setup

# Start the development server
composer dev
```

Visit `http://localhost:8000` and create your account.

## Architecture

```
LaStarter/
├── app/
│   ├── Actions/          # Single-responsibility action classes
│   ├── Core/             # Extension, navigation, settings, hooks systems
│   ├── Concerns/         # HasTeam, HasTeams, GeneratesUniqueTeamSlugs
│   ├── Enums/            # TeamRole and other backed enums
│   ├── Policies/         # Authorization via hasPermissionTo()
│   └── Http/
│       ├── Controllers/
│       ├── Middleware/    # SetPermissionsTeamId, EnsureTeamMembership
│       └── Requests/      # Form Request validation
├── extensions/
│   ├── modules/          # Business logic modules
│   └── themes/           # UI theme overrides
├── resources/
│   └── js/
│       ├── pages/        # Core Inertia pages
│       ├── components/   # Reusable UI components (shadcn/ui)
│       └── layouts/      # App, auth, and settings layouts
└── database/
    └── migrations/       # All schema changes
```

### Key Concepts

- **Team = Organization** — the primary tenant unit
- **Global scope** — `HasTeam` trait auto-filters all queries by `team_id`
- **Backend = source of truth** — frontend receives resolved permissions, never decides access
- **Policies, not role names** — every access check uses `$user->hasPermissionTo()`

## Extension System

Extensions live in `/extensions/{type}/{slug}/` with an `extension.json` manifest:

```json
{
    "identifier": "projects",
    "name": "Projects",
    "type": "module",
    "version": "1.0.0",
    "description": "Project management module",
    "author": "OneSubnet",
    "namespace": "Modules\\Projects",
    "provider": "Modules\\Projects\\ProjectServiceProvider",
    "permissions": ["project.view", "project.create", "project.update", "project.delete"],
    "navigation": {
        "app": [{ "title": "Projects", "href": "/projects", "icon": "FolderKanban", "permission": "project.view" }]
    }
}
```

### Extension CLI

```bash
php artisan extensions:scan        # Discover extensions on disk
php artisan extensions:sync        # Sync permissions to database
php artisan extensions:enable {id} # Enable globally or per team
php artisan extensions:disable {id}
```

### Adding a Module

1. Create `extensions/modules/{slug}/extension.json`
2. Create a ServiceProvider extending `ModuleServiceProvider`
3. Add models with the `HasTeam` trait
4. Define permissions in the manifest
5. Run `extensions:scan` and `extensions:sync`

See [CLAUDE.md](CLAUDE.md) for the complete development guide.

## Commands

```bash
# Development
composer dev              # PHP server + queue + Vite
npm run dev               # Vite dev server only

# Code quality
composer run lint         # Pint fix (PHP)
composer run lint:check   # Pint check (PHP)
composer run test         # Pint check + Pest tests
npm run lint              # ESLint fix
npm run format            # Prettier write
npm run types:check       # TypeScript check

# Production
npm run build             # Production build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## Security

If you discover a security vulnerability, please email security@onesubnet.com instead of using the issue tracker.

## License

LaStarter is open-source software licensed under the [MIT license](LICENSE).
