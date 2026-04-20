# LaStarter

**Plateforme multi-tenant modulaire construite avec Laravel, React et TypeScript.**

![Laravel](https://img.shields.io/badge/Laravel-13-red)
![React](https://img.shields.io/badge/React-19-blue)
![Inertia](https://img.shields.io/badge/Inertia-3-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Fonctionnalités

- **Multi-tenant** — Équipes en tant qu'organisations avec isolation automatique des données via scopes globaux
- **Rôles et permissions dynamiques** — Système Spatie en mode équipes, aucun check de rôle hardcodé
- **Système d'extensions** — Modules, thèmes avec intégration marketplace
- **Surcharges de thème** — Résolution de page en 3 niveaux : thème → module → core
- **Navigation contextuelle** — Sidebar construite depuis les manifests d'extensions actives, filtrée par permissions
- **Routes typées** — Wayfinder génère automatiquement des helpers TypeScript depuis les routes PHP
- **Audit logging** — Traçage des actions sensibles avec contexte équipe, utilisateur et trace IDs
- **Dashboard dynamique** — Widgets exportés par les modules via le système de Hooks

## Prérequis

- PHP 8.4+
- Node.js 22+
- SQLite, MySQL 8+, MariaDB 10.3+, ou PostgreSQL 14+

## Installation rapide

```bash
# Cloner le dépôt
git clone https://github.com/OneSubnet/LaStarter.git
cd LaStarter

# Installation complète (dépendances, .env, clé, migrations)
composer setup

# Lancer le serveur de développement
composer dev
```

Visitez `http://localhost:8000` et créez votre compte.

## Architecture

```
LaStarter/
├── app/
│   ├── Actions/          # Classes d'action à responsabilité unique
│   ├── Core/             # Systèmes d'extensions, navigation, settings, hooks
│   ├── Concerns/         # HasTeam, HasTeams, GeneratesUniqueTeamSlugs
│   ├── Enums/            # TeamRole, MembershipStatus et autres backed enums
│   ├── Policies/         # Autorisation via hasPermissionTo()
│   └── Http/
│       ├── Controllers/
│       ├── Middleware/    # SetPermissionsTeamId, EnsureTeamMembership
│       └── Requests/      # Validation Form Request
├── extensions/
│   ├── modules/          # Modules métier (projects, tasks, forms, spaces)
│   └── themes/           # Surcharges UI
├── resources/
│   └── js/
│       ├── pages/        # Pages Inertia core
│       ├── components/   # Composants UI réutilisables (shadcn/ui)
│       └── layouts/      # Layouts app, auth et settings
└── database/
    └── migrations/       # Toutes les modifications de schéma
```

### Concepts clés

- **Team = Organisation** — l'unité tenant principale
- **Scope global** — Le trait `HasTeam` filtre automatiquement toutes les requêtes par `team_id`
- **Backend = source de vérité** — Le frontend reçoit les permissions résolues, ne décide jamais de l'accès
- **Policies, pas noms de rôles** — Chaque vérification d'accès utilise `$user->hasPermissionTo()`

## Système d'extensions

Les extensions vivent dans `/extensions/{type}/{slug}/` avec un manifeste `extension.json` :

```json
{
    "identifier": "projects",
    "name": "Projects",
    "type": "module",
    "version": "1.0.0",
    "description": "Module de gestion de projets",
    "author": "LaStarter",
    "namespace": "Modules\\Projects",
    "provider": "Modules\\Projects\\ProjectServiceProvider",
    "permissions": ["project.view", "project.create", "project.update", "project.delete"],
    "navigation": {
        "app": [{ "title": "Projects", "icon": "FolderKanban", "permission": "project.view" }]
    }
}
```

### CLI d'extensions

```bash
php artisan extensions:scan        # Découvrir les extensions sur le disque
php artisan extensions:sync        # Synchroniser les permissions en base
php artisan extensions:enable {id} # Activer globalement ou par équipe
php artisan extensions:disable {id}
```

### Ajouter un module

1. Créer `extensions/modules/{slug}/extension.json`
2. Créer un ServiceProvider étendant `ModuleServiceProvider`
3. Ajouter des modèles avec le trait `HasTeam`
4. Définir les permissions dans le manifeste
5. Enregistrer les widgets dashboard via `Hook::listen(Hook::DASHBOARD_RENDER, ...)`
6. Lancer `extensions:scan` et `extensions:sync`

Voir [CLAUDE.md](CLAUDE.md) pour le guide de développement complet.

## Commandes

```bash
# Développement
composer dev              # Serveur PHP + queue + Vite
npm run dev               # Serveur Vite uniquement

# Qualité du code
composer run lint         # Pint fix (PHP)
composer run lint:check   # Pint check (PHP)
composer run test         # Pint check + Pest tests
npm run lint              # ESLint fix
npm run format            # Prettier write
npm run types:check       # Vérification TypeScript

# Production
npm run build             # Build production
```

## Contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les directives de développement.

## Sécurité

Si vous découvrez une vulnérabilité de sécurité, merci d'envoyer un email à security@onesubnet.com au lieu d'utiliser le tracker d'issues.

## Licence

LaStarter est un logiciel open-source sous la [licence MIT](LICENSE).
