<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13-red?style=flat-square" alt="Laravel">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square" alt="React">
  <img src="https://img.shields.io/badge/Inertia-3-purple?style=flat-square" alt="Inertia">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/PHP-8.4+-777BB4?style=flat-square" alt="PHP">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

# LaStarter

**Modular multi-tenant platform core — Laravel 13 · React 19 · TypeScript · Inertia.js 3**

LaStarter provides everything you need to build a multi-tenant SaaS application: team-based data isolation, a dynamic extension system with marketplace, per-team roles and permissions, real-time WebSocket messaging, and a complete admin dashboard.

---

## Features

### Core Platform

- **Multi-tenancy** — Teams as organizations with automatic data isolation via global scopes (`HasTeam` trait)
- **Dynamic roles & permissions** — Spatie in teams mode; atomic permission checks via `hasPermissionTo()`, never hardcoded role names
- **Extension system** — Modules, themes, and language packs with GitHub-based marketplace integration
- **Theme overrides** — 3-level page resolution: theme → module → core
- **Contextual navigation** — Sidebar built from active extension manifests, filtered by user permissions
- **Type-safe routes** — Wayfinder auto-generates TypeScript route helpers from PHP routes
- **Audit logging** — Tracks sensitive actions with team context, user, IP, and trace IDs
- **Dynamic dashboard** — Widgets exported by modules via the Hook system
- **i18n** — English and French, backend and frontend, extensible via language packs

### System Management

- **Backups** — Core (app + extensions), database (SQLite / MySQL / PostgreSQL), extension-specific; HMAC-signed download URLs
- **Core updates** — Checks GitHub releases, validates extension compatibility, auto-backup, download/extract, run migrations
- **Compatibility checker** — Validates that `provides` and `permissions` never shrink (API contract enforcement)

### Developer Experience

- **CLI tool** — [`lastarter-cli`](https://github.com/OneSubnet/LaStarter-CLI) for scaffolding modules, themes, controllers, models, pages, and more
- **Auto-autoload** — Extensions registered via `spl_autoload_register`; no `composer dump-autoload` needed
- **Hot reload** — Vite HMR with concurrent PHP server, queue worker, and frontend dev server

---

## Requirements

| Requirement | Version |
|---|---|
| PHP | 8.4+ |
| Node.js | 22+ |
| Database | SQLite, MySQL 8+, MariaDB 10.3+, or PostgreSQL 14+ |
| Composer | 2.x |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/OneSubnet/LaStarter.git
cd LaStarter

# Full setup (dependencies, .env, key, migrations, build)
composer setup

# Start the development server
composer dev
```

Visit `http://localhost:8000` and create your account.

Or use the CLI:

```bash
composer global require onesubnet/lastarter-cli
lastarter new my-project
cd my-project
composer dev
```

---

## Architecture Overview

```
LaStarter/
├── app/
│   ├── Actions/              # Single-responsibility action classes
│   ├── Core/                 # Core systems
│   │   ├── Context/          #   AppContext (scoped request singleton)
│   │   ├── Extensions/       #   ExtensionManager, manifests, marketplace
│   │   ├── Hooks/            #   Hook::dispatch / Hook::listen
│   │   ├── Modules/          #   ModuleServiceProvider, ModuleApiRegistry
│   │   ├── Navigation/       #   NavigationBuilder (dynamic sidebar)
│   │   ├── Settings/         #   SettingManager (per-team key-value store)
│   │   └── System/           #   BackupManager, CoreUpdater, SignedDownloadUrl
│   ├── Concerns/             #   HasTeam, HasTeams, GeneratesUniqueTeamSlugs
│   ├── Enums/                #   TeamRole, MembershipStatus
│   ├── Policies/             #   Authorization via hasPermissionTo()
│   └── Http/
│       ├── Controllers/      #   Inertia controllers
│       ├── Middleware/        #   SetPermissionsTeamId, EnsureTeamMembership, etc.
│       └── Requests/         #   Form request validation
├── extensions/
│   ├── modules/              #   Business modules (CRM, LMS, etc.)
│   ├── themes/               #   UI theme overrides
│   └── languages/            #   Additional translation packs
├── resources/
│   └── js/
│       ├── pages/            #   Inertia pages (core)
│       ├── components/       #   Reusable UI components (shadcn/ui)
│       ├── hooks/            #   Custom React hooks
│       ├── lib/              #   Utilities (format, i18n, echo, schemas)
│       ├── layouts/          #   App, auth, and settings layouts
│       └── locales/          #   Frontend translations (en, fr)
├── database/
│   └── migrations/           #   All schema changes
├── routes/
│   ├── web.php               #   Web routes
│   ├── console.php           #   Scheduled tasks
│   └── channels.php          #   Broadcasting channels
└── tests/                    #   Pest feature & unit tests
```

### Key Concepts

| Concept | Implementation |
|---|---|
| **Team = Tenant** | The `Team` model is the tenant. No separate `Organization` model. |
| **Global scope** | `HasTeam` trait auto-filters all queries by `team_id` |
| **Backend = authority** | Policies use `$user->hasPermissionTo()` — frontend guards are UI-only |
| **Permissions are atomic** | Strings like `team.update`, `member.add` — never role name checks |
| **Auto-autoload** | `spl_autoload_register` in ExtensionManager — no `composer dump-autoload` |
| **3-level pages** | Theme override → Module page → Core fallback |

---

## Extension System

Extensions live in `/extensions/{type}/{slug}/` with an `extension.json` manifest.

### Extension Types

| Type | Directory | Description |
|---|---|---|
| `module` | `extensions/modules/{slug}/` | Business logic (CRM, billing, LMS…) |
| `theme` | `extensions/themes/{slug}/` | UI overrides and CSS |
| `language` | `extensions/languages/{slug}/` | Additional translation packs |

### Extension Manifest

```json
{
    "$schema": "https://raw.githubusercontent.com/OneSubnet/LaStarter/main/schemas/extension.schema.json",
    "identifier": "my-module",
    "name": "My Module",
    "type": "module",
    "version": "1.0.0",
    "namespace": "Modules\\MyModule",
    "provider": "Modules\\MyModule\\MyModuleServiceProvider",
    "permissions": ["my-module.view", "my-module.create"],
    "navigation": {
        "app": [
            {
                "title": "My Module",
                "icon": "FolderKanban",
                "order": 10,
                "children": [
                    { "title": "List", "route": "my-module.index", "icon": "List", "order": 1 }
                ]
            }
        ]
    },
    "dependencies": [],
    "provides": [],
    "widgets": [],
    "metrics": []
}
```

### Extension CLI

```bash
php artisan extensions:scan                      # Discover extensions on disk
php artisan extensions:sync                      # Sync permissions to database
php artisan extensions:list                      # List registered extensions
php artisan extensions:install {id}              # Install (run migrations)
php artisan extensions:enable {id}               # Enable globally
php artisan extensions:enable {id} --team=ID     # Enable for specific team
php artisan extensions:disable {id}              # Disable
php artisan extensions:uninstall {id}            # Rollback + delete
php artisan extensions:check-updates             # Check for updates
php artisan extensions:update {id}               # Update an extension
```

### Creating a Module

```bash
# Using the CLI (recommended)
lastarter new module my-module

# Or manually
# 1. Create extensions/modules/my-module/extension.json
# 2. Create a ServiceProvider extending ModuleServiceProvider
# 3. Add models with the HasTeam trait
# 4. Define permissions in the manifest
# 5. Run php artisan extensions:scan && extensions:sync
```

---

## System Management

### Backups

| Type | Content | Format |
|---|---|---|
| **Core** | app, config, resources, routes, extensions, composer/package files | `.zip` |
| **Extension** | Files of a specific extension | `.zip` |
| **Database** | Full dump (SQLite copy, `pg_dump`, or `mysqldump`) | `.sqlite` / `.sql` |

Downloads use **HMAC-SHA256 signed URLs** with encrypted payload and configurable expiration — no session auth required.

### Core Updates

```bash
php artisan core:version                # Show current version
php artisan core:update --check         # Check for available updates
php artisan core:update                 # Run the update
```

The update flow: check GitHub releases → validate extension compatibility → create backup → download ZIP → verify integrity → extract (preserving .env, storage, extensions) → run migrations.

### Scheduled Tasks

- **Core update check** — Daily at 03:00 via `routes/console.php`

---

## Commands Reference

### Development

```bash
composer dev                # PHP server + queue + Vite (concurrent)
npm run dev                 # Vite dev server only
```

### Code Quality

```bash
composer run lint           # Pint fix (PHP)
composer run lint:check     # Pint check (PHP)
composer run analyze        # PHPStan static analysis
composer run test           # Pint check + Pest tests
npm run lint                # ESLint fix
npm run lint:check          # ESLint check
npm run format              # Prettier write
npm run format:check        # Prettier check
npm run types:check         # TypeScript type check
```

### Production

```bash
npm run build               # Production build
npm run build:ssr           # Production build + SSR bundle
```

---

## Real-Time

- **Server:** Laravel Reverb (self-hosted WebSocket)
- **Client:** laravel-echo + pusher-js
- **Channels:** defined in `routes/channels.php`
- **Enable:** set `BROADCAST_DRIVER=reverb` in `.env`

---

## Testing

Tests use **Pest 4** with `RefreshDatabase` (auto-applied). SQLite in-memory for tests.

```bash
./vendor/bin/pest                                        # Run all tests
./vendor/bin/pest tests/Feature/Teams/TeamTest.php       # Single file
./vendor/bin/pest --filter=test_name                     # By name
```

---

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for development guidelines.

## Security

If you discover a security vulnerability, please email **security@onesubnet.com** instead of using the issue tracker.

## License

LaStarter is open-source software licensed under the [MIT license](LICENSE).
