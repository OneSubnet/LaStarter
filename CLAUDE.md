# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modular multi-tenant platform core built on **Laravel 13 + React 19 + TypeScript + Inertia.js 3**. Teams act as organizations with dynamic roles and permissions via `spatie/laravel-permission` (teams mode). A global scope ensures automatic data isolation between teams. The extension system supports dynamic modules and themes.

## Commands

```bash
composer dev              # Start all (PHP server + queue + Vite)
composer setup            # Full setup from scratch
composer run lint         # Pint fix (PHP)
composer run lint:check   # Pint check (PHP)
composer run test         # Pint check + Pest tests
npm run dev               # Vite dev server
npm run build             # Production build
npm run lint              # ESLint fix
npm run format            # Prettier write (resources/)
npm run types:check       # TypeScript check (tsc --noEmit)
```

Extension CLI commands:
```bash
php artisan extensions:scan        # Scan /extensions/ for extension.json manifests
php artisan extensions:sync        # Sync permissions from manifests to Spatie
php artisan extensions:enable {id} # Enable extension globally
php artisan extensions:enable {id} --team=ID  # Enable for specific team
php artisan extensions:disable {id}            # Disable globally or per team
```

## Architecture

### Multi-Tenancy

- **Team = Organization**. The `Team` model IS the tenant. No separate `Organization` model.
- **Global Scope**: `App\Concerns\HasTeam` trait + `TeamScope` class auto-filter all queries by `current_team_id`. Future module models MUST use this trait.
- **Spatie teams mode**: `config/permission.php` has `'teams' => true`. Roles are scoped per team via `team_id` on the `roles` table.
- **Context middleware**: `SetPermissionsTeamId` calls `setPermissionsTeamId()` before every request so `$user->hasPermissionTo()` checks are team-scoped.

### Extension System

- **Extensions** live in `/extensions/{type}/{slug}/` with an `extension.json` manifest
- **Types**: `module` (business logic) and `theme` (UI overrides)
- **ExtensionManager** (`app/Core/Extensions/ExtensionManager.php`): singleton that scans, syncs, enables/disables extensions
- **Module ServiceProvider**: abstract base at `app/Core/Modules/ModuleServiceProvider.php`. Each module extends it and implements `registerModule()` + `bootModule()`
- **Module autoloading**: uses `spl_autoload_register` in ExtensionManager — no `composer dump-autoload` needed after adding modules
- **Database**: `extensions` table (global registry), `team_extensions` pivot (per-team activation), `team_settings` (per-team key-value settings)

### Page Resolution (Inertia + React)

- **3-level resolution**: theme override → module page → core fallback
- **Frontend**: `resources/js/app.tsx` uses `import.meta.glob` to scan `./pages/`, `extensions/modules/*/resources/js/pages/`, and `extensions/themes/*/resources/js/overrides/`
- **Backend**: Controllers use `Inertia::render('projects/Index', $props)` — the name is resolved on the frontend
- **Theme overrides**: A theme can override any module page by placing a file at `overrides/{pageName}.tsx`

### Navigation

- **NavigationBuilder** (`app/Core/Navigation/NavigationBuilder.php`): builds sidebar navigation from enabled extension manifests
- **Filtered by**: user permissions (`hasPermissionTo`) and active extensions per team
- **Shared via Inertia**: `navigation` prop in `HandleInertiaRequests`
- **Frontend**: `app-sidebar.tsx` consumes `page.props.navigation` with icon string→Lucide mapping

### Settings

- **SettingManager** (`app/Core/Settings/SettingManager.php`): per-team key-value store
- **Helper**: `setting('key')` and `setting_set('key', 'value')` global functions
- **Facade**: `Setting::get('key')`, `Setting::set('key', 'value')`

### Hooks

- **Hook** (`app/Core/Hooks/Hook.php`): thin wrapper over Laravel Events with `hooks.` prefix
- `Hook::listen('event', $callback)` → `Event::listen('hooks.event', $callback)`
- `Hook::dispatch('event', $data)` → `Event::dispatch('hooks.event', $data)`
- Standard hooks: `sidebar.build`, `dashboard.render`, `module.boot`, `extension.enabled`, `extension.disabled`

### Authorization Flow

1. **Permissions** are atomic strings stored in DB (e.g. `team.update`, `member.add`, `project.view`). Seeded via migrations and synced from extension manifests via `extensions:sync`.
2. **Roles** are per-team records in the `roles` table, composed of permissions via `role_has_permissions`.
3. **Users** get roles assigned in team context via `model_has_roles` (includes `team_id`).
4. **Policies** check `$user->hasPermissionTo('permission.name')` — NEVER role names.
5. **Frontend** receives `auth.permissions` (string array) via Inertia shared data. The `<Guard>` component hides/shows UI elements.

### Key Models

| Model | Role |
|-------|------|
| `User` | Global identity. Uses `HasRoles` (Spatie) + `HasTeams` (custom trait). |
| `Team` | The tenant/org. Uses `HasRoles` (Spatie). Has `memberships`, `invitations`, `modules`, `teamExtensions`, `extensionSettings`. |
| `Membership` | Pivot on `team_members` with `role`, `status` (invited/active/suspended), `joined_at`. |
| `TeamModule` | Legacy — tracks which modules are active per team (`module_identifier` + `is_active`). |
| `Extension` | Global extension registry from `extension.json` manifests. |
| `TeamExtension` | Per-team extension activation pivot. |
| `TeamSetting` | Per-team key-value settings, uses `HasTeam` trait. |

### Backend Structure

- **Core**: `app/Core/Extensions/`, `app/Core/Modules/`, `app/Core/Navigation/`, `app/Core/Settings/`, `app/Core/Hooks/`, `app/Core/Themes/`
- **Controllers**: `app/Http/Controllers/Teams/` — TeamController, TeamMemberController, TeamInvitationController, RoleController
- **Policies**: `app/Policies/` — TeamPolicy, RolePolicy (all use `hasPermissionTo`, never role name checks)
- **Middleware**: `SetPermissionsTeamId` (Spatie context), `EnsureTeamMembership` (team access + optional permission check)
- **Actions**: `app/Actions/Teams/CreateTeam` — creates team + owner role + assigns all permissions
- **Extensions**: `extensions/modules/{slug}/` and `extensions/themes/{slug}/` with `extension.json` manifest

### Frontend (React + Inertia)

- **Entry**: `resources/js/app.tsx` — custom resolve function with 3-level page resolution (theme override → module → core)
- **Guard component**: `resources/js/components/guard.tsx` — `<Guard permission="role.create">...</Guard>`
- **Sidebar**: `resources/js/components/app-sidebar.tsx` — dynamic navigation from Inertia shared `navigation` prop
- **Pages**: `resources/js/pages/` (core), `extensions/modules/*/resources/js/pages/` (modules), `extensions/themes/*/resources/js/overrides/` (theme overrides)
- **Routes**: Wayfinder auto-generates type-safe route helpers in `resources/js/routes/`
- **Permissions injected**: `HandleInertiaRequests` shares `auth.permissions` as `string[]`

### Adding a New Module

1. Create `extensions/modules/{slug}/extension.json` with permissions, navigation, settings
2. Create module directory structure: `src/`, `routes/`, `database/migrations/`, `resources/js/pages/`
3. Create a ServiceProvider extending `ModuleServiceProvider`
4. Create models with `use HasTeam` trait (auto-scopes + auto-fills `team_id`)
5. Create Policy using `$user->hasPermissionTo()`
6. Register Policy in `AppServiceProvider::boot()`
7. Run `php artisan extensions:scan` to register in DB
8. Run `php artisan extensions:sync` to seed permissions
9. Run `php artisan extensions:enable {slug} --team=ID` to activate
10. Run `php artisan migrate` to run module migrations

### Database

- Single shared database, logical isolation via `team_id` column
- SQLite for tests, configurable for production (MySQL/PostgreSQL)

## Critical Rules

- **NEVER** use `if ($user->role === 'admin')` or any hardcoded role check. Always use `$user->hasPermissionTo('...')`.
- **NEVER** trust frontend guards for security. Backend Policies are the authority.
- **NEVER** add a module model without the `HasTeam` trait — it must be scoped to a team.
- The `owner` role is protected — it cannot be renamed, modified, or deleted via the UI.
- Permissions are global (not per-team). Roles are per-team.
- Module pages must use `@/` imports (resolved by Vite relative to `resources/js/`).
- Module routes are auto-registered via ServiceProvider, wrapped in `{current_team}` prefix with `EnsureTeamMembership` middleware.
