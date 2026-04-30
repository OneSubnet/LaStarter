# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modular multi-tenant platform core built on **Laravel 13 + React 19 + TypeScript + Inertia.js 3**. Teams act as organizations with dynamic roles and permissions via `spatie/laravel-permission` (teams mode). A global scope ensures automatic data isolation between teams. The extension system supports dynamic modules and themes. i18n supports EN/FR. Real-time via Laravel Reverb + Echo.

## Commands

```bash
composer dev              # Start all (PHP server + queue + Vite)
composer setup            # Full setup from scratch (install + migrate + build)
composer run lint         # Pint fix (PHP)
composer run lint:check   # Pint check (PHP)
composer run analyze      # PHPStan static analysis
composer run test         # Pint check + Pest tests
npm run dev               # Vite dev server
npm run build             # Production build
npm run build:ssr         # Production build + SSR bundle
npm run lint              # ESLint fix
npm run lint:check        # ESLint check only
npm run format            # Prettier write (resources/)
npm run format:check      # Prettier check
npm run types:check       # TypeScript check (tsc --noEmit)
./vendor/bin/pest         # Run all Pest tests
./vendor/bin/pest tests/Feature/Teams/TeamTest.php  # Run single test file
./vendor/bin/pest --filter=test_name                # Run test by name
php artisan wayfinder:generate             # Regenerate type-safe route helpers
```

Extension CLI commands:
```bash
php artisan extensions:scan        # Scan /extensions/ for extension.json manifests
php artisan extensions:sync        # Sync permissions from manifests to Spatie
php artisan extensions:list        # List all registered extensions
php artisan extensions:make {slug} # Scaffold a new extension
php artisan extensions:install {id}              # Install (run migrations, set disabled)
php artisan extensions:install {id} --team=ID    # Install for specific team
php artisan extensions:enable {id}               # Enable extension globally
php artisan extensions:enable {id} --team=ID     # Enable for specific team
php artisan extensions:disable {id}              # Disable globally or per team
php artisan extensions:uninstall {id}            # Rollback migrations, remove from registry
```

## Architecture

### AppContext (Request Context)

`App\Core\Context\AppContext` is a singleton providing lazy-loaded access to the current request context:
- `app(AppContext::class)->user()` — current authenticated user
- `app(AppContext::class)->team()` — current team (from `$user->currentTeam`)
- `app(AppContext::class)->membership()` — current membership on that team
- `app(AppContext::class)->permissions()` — all permission names for the user in team context

Used in middleware (`HandleInertiaRequests`, `SetAppLocale`) and controllers instead of injecting `Request` directly for team/user context.

### Multi-Tenancy

- **Team = Organization**. The `Team` model IS the tenant. No separate `Organization` model.
- **Global Scope**: `App\Concerns\HasTeam` trait + `TeamScope` class auto-filter all queries by `current_team_id`. Future module models MUST use this trait.
- **Spatie teams mode**: `config/permission.php` has `'teams' => true`. Roles are scoped per team via `team_id` on the `roles` table.
- **Context middleware**: `SetPermissionsTeamId` calls `setPermissionsTeamId()` before every request so `$user->hasPermissionTo()` checks are team-scoped.
- **TeamRole enum**: `App\Enums\TeamRole` — `Owner`, `Admin`, `Member`. The `owner` role is protected and cannot be renamed/modified/deleted via UI.

### Extension System

- **Extensions** live in `/extensions/{type}/{slug}/` with an `extension.json` manifest
- **Types**: `module` (business logic), `theme` (UI overrides), `language` (translations)
- **Active modules**: `ailes-invisibles` (CRM/messaging), `projects`; theme: `default`
- **ExtensionManager** (`app/Core/Extensions/ExtensionManager.php`): singleton that scans, syncs, enables/disables extensions
- **Module ServiceProvider**: abstract base at `app/Core/Modules/ModuleServiceProvider.php`. Each module extends it and implements `registerModule()` + `bootModule()`
- **Module autoloading**: uses `spl_autoload_register` in ExtensionManager — no `composer dump-autoload` needed after adding modules
- **Database**: `extensions` table (global registry), `team_extensions` pivot (per-team activation), `team_settings` (per-team key-value settings)
- **Marketplace**: `MarketplaceClient` (`app/Core/Extensions/Marketplace/MarketplaceClient.php`) handles extension discovery and installation from a GitHub-based marketplace

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
- Standard hooks (use constants): `SIDEBAR_BUILD`, `MODULE_BOOT`, `EXTENSION_ENABLED`, `EXTENSION_DISABLED`, `EXTENSION_INSTALLED`, `EXTENSION_UNINSTALLED`, `EXTENSION_ERROR`, `THEME_CHANGED`

### Authorization Flow

1. **Permissions** are atomic strings stored in DB (e.g. `team.update`, `member.add`, `project.view`). Seeded via migrations and synced from extension manifests via `extensions:sync`.
2. **Roles** are per-team records in the `roles` table, composed of permissions via `role_has_permissions`.
3. **Users** get roles assigned in team context via `model_has_roles` (includes `team_id`).
4. **Policies** check `$user->hasPermissionTo('permission.name')` — NEVER role names.
5. **Frontend** receives `auth.permissions` (string array) via Inertia shared data. The `<Guard>` component hides/shows UI elements.

### i18n (Internationalization)

- **i18next + react-i18next** on the frontend
- **Core locales**: `resources/js/locales/{en,fr}.json`
- **Extension locales**: `extensions/modules/*/resources/locales/{en,fr}.json` — loaded dynamically via `import.meta.glob`
- **Language selection**: shared via Inertia as `locale`, `fallbackLocale`, `availableLocales` props. Language switches on navigation via `router.on('navigate')`.
- **Backend locale**: `SetAppLocale` middleware sets `app()->setLocale()` from team or user preference

### Real-Time (WebSocket)

- **Laravel Reverb** (self-hosted) as default broadcast driver, Pusher as alternative
- **Client**: `laravel-echo` + `pusher-js`, initialized in `resources/js/lib/echo.ts` (client-side only, SSR-safe)
- **Channels**: defined in `routes/channels.php` (e.g. `conversation.{id}` for messaging)
- Broadcasting is enabled when `BROADCAST_DRIVER=reverb` in `.env`

### Audit

- **AuditLogger** (`app/Core/Audit/AuditLogger.php`): singleton service for logging team-scoped audit trails
- Logs: `action`, `subject` (polymorphic), `properties`, `ip_address`, `user_agent`, `trace_id`, `module`
- Auto-fills `team_id` and `user_id` from current auth context
- Shared via Inertia as `auditLogs`

### Shared Inertia Props

`HandleInertiaRequests` shares these props to every page:
`auth.user`, `auth.permissions`, `currentTeam`, `teams`, `navigation`, `teamMembers` (with online status), `auditLogs`, `theme`, `locale`, `fallbackLocale`, `availableLocales`, `footerLinks`, `unreadNotifications`, `recentNotifications`, `unreadMessageCount`, `sidebarOpen`

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

- **Core**: `app/Core/` — `Context/`, `Extensions/`, `Modules/`, `Navigation/`, `Settings/`, `Hooks/`, `Themes/`
- **Controllers**: `app/Http/Controllers/Teams/` — TeamController, TeamMemberController, TeamInvitationController, RoleController
- **Policies**: `app/Policies/` — TeamPolicy, RolePolicy (all use `hasPermissionTo`, never role name checks)
- **Middleware**: `SetPermissionsTeamId` (Spatie context), `ConfigureTeamMailer` (team-specific mail config), `EnsureTeamMembership` (team access + optional permission check), `SetAppLocale`, `SetTeamUrlDefaults`
- **Actions**: `app/Actions/Teams/CreateTeam` — creates team + owner role + assigns all permissions
- **Extensions**: `extensions/modules/{slug}/` and `extensions/themes/{slug}/` with `extension.json` manifest

### Frontend (React + Inertia)

- **Entry**: `resources/js/app.tsx` — custom resolve function with 3-level page resolution (theme override → module → core)
- **Guard component**: `resources/js/components/guard.tsx` — `<Guard permission="role.create">...</Guard>`
- **Sidebar**: `resources/js/components/app-sidebar.tsx` — dynamic navigation from Inertia shared `navigation` prop
- **Pages**: `resources/js/pages/` (core), `extensions/modules/*/resources/js/pages/` (modules), `extensions/themes/*/resources/js/overrides/` (theme overrides)
- **Routes**: Wayfinder auto-generates type-safe route helpers in `resources/js/routes/`
- **Permissions injected**: `HandleInertiaRequests` shares `auth.permissions` as `string[]`
- **UI stack**: Tailwind CSS v4, Radix UI primitives (shadcn/ui pattern), Tanstack Query/Form/Table, Lucide icons
- **ESLint**: flat config with import ordering enforced — keep `@/` imports after external packages

### Testing

- **Framework**: Pest 4 (PHPUnit wrapper). Feature tests use `RefreshDatabase` trait (auto-applied via `tests/Pest.php`).
- **Database**: SQLite in-memory for tests.
- **Helpers**:
  - `setupTeamAuth($user, $team)` — sets permissions team context + acts as user + switches team
  - `CreatesTeams` trait (`tests/Concerns/CreatesTeams.php`) — `createTeamWithOwner()`, `createTeamForUser()`, `addMemberToTeam()`, `givePermission()`
  - `WithAilesInvisibles` trait — enables the ailes-invisibles module for tests that need it
- **Test location**: `tests/Feature/` for feature tests, `tests/Unit/` for unit tests

### CI (GitHub Actions)

Three workflows on push/PR to `main` and `develop`:
- **lint.yml**: Pint + Prettier + ESLint + TypeScript check
- **tests.yml**: Pest tests on PHP 8.4/8.5 × SQLite/PostgreSQL matrix. Also builds assets and runs `types:check`.
- **release.yml**: Asset compilation + GitHub release on tags

Both lint and test workflows run `extensions:scan`, `extensions:sync`, enable all modules, and run `wayfinder:generate` before checks.

### Adding a New Module

1. Create `extensions/modules/{slug}/extension.json` with permissions, navigation, settings
2. Create module directory structure: `src/`, `routes/`, `database/migrations/`, `resources/js/pages/`
3. Create a ServiceProvider extending `ModuleServiceProvider`
4. Create models with `use HasTeam` trait (auto-scopes + auto-fills `team_id`)
5. Create Policy using `$user->hasPermissionTo()`
6. Register Policy in `AppServiceProvider::boot()`
7. Run `php artisan extensions:scan` to register in DB
8. Run `php artisan extensions:sync` to seed permissions
9. Run `php artisan extensions:install {slug}` to run migrations
10. Run `php artisan extensions:enable {slug} --team=ID` to activate

### Database

- Single shared database, logical isolation via `team_id` column
- SQLite for local dev/tests, PostgreSQL tested in CI, MySQL supported

## Critical Rules

- **NEVER** use `if ($user->role === 'admin')` or any hardcoded role check. Always use `$user->hasPermissionTo('...')`.
- **NEVER** trust frontend guards for security. Backend Policies are the authority.
- **NEVER** add a module model without the `HasTeam` trait — it must be scoped to a team.
- The `owner` role is protected — it cannot be renamed, modified, or deleted via the UI.
- Permissions are global (not per-team). Roles are per-team.
- Module pages must use `@/` imports (resolved by Vite relative to `resources/js/`).
- Module routes are auto-registered via ServiceProvider, wrapped in `{current_team}` prefix with `EnsureTeamMembership` middleware.
- Run `php artisan wayfinder:generate` after adding/modifying routes to keep frontend route helpers in sync.
