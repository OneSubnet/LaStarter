# Guide de Contribution

Merci de votre interet pour LaStarter ! Ce document vous guidera dans le processus de contribution.

## Developpement Local

### Prerequis

* PHP 8.4+
* Node.js 22+
* Composer
* SQLite (pour les tests) ou MySQL/PostgreSQL

### Installation

```bash
git clone https://github.com/OneSubnet/LaStarter.git
cd LaStarter
composer setup
npm run build
composer dev
```

### Commandes Utiles

```bash
composer dev          # Demarrer le serveur + queue + Vite
composer run lint     # Pint (PHP)
composer run test     # Pint check + Pest
npm run dev           # Vite dev server
npm run lint          # ESLint
npm run types:check   # TypeScript check
```

## Processus de Contribution

### 1. Fork & Branch

```bash
# Fork le depot sur GitHub, puis :
git clone https://github.com/VOTRE-USER/LaStarter.git
cd LaStarter
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 2. Developpement

* Suivez les conventions de code existantes
* Ajoutez des tests pour les nouvelles fonctionnalites
* Assurez-vous que `composer run lint` et `npm run types:check` passent

### 3. Commit

Utilisez des messages de commit clairs et descriptifs :

```
feat: ajout du module de formulaires
fix: correction de la pagination sur la page des extensions
docs: mise a jour du guide d'extension
```

### 4. Pull Request

* Ouvrez une PR vers la branche `main`
* Decrivez clairement les changements effectues
* Referencez les issues concernees
* Assurez-vous que les checks CI passent

## Creer une Extension

LaStarter supporte trois types d'extensions : les **modules** (logique metier), les **themes** (surcharges UI) et les **langues** (traductions supplementaires).

### Structure d'un Module

```
extensions/modules/{slug}/
├── extension.json           # Manifeste obligatoire (schema JSON disponible)
├── src/
│   ├── Providers/
│   │   └── {Name}ServiceProvider.php
│   ├── Controllers/
│   ├── Models/
│   ├── Policies/
│   └── Http/Requests/
├── routes/
│   └── web.php
├── database/
│   ├── migrations/
│   └── seeders/
└── resources/
    ├── js/
    │   └── pages/
    └── locales/
        ├── en.json
        └── fr.json
```

### Manifeste (extension.json)

```json
{
  "$schema": "https://raw.githubusercontent.com/one-subnet/lastarter/refs/heads/main/schemas/extension.schema.json",
  "name": "Mon Module",
  "identifier": "mon-module",
  "type": "module",
  "version": "1.0.0",
  "description": "Description du module",
  "author": "Votre Nom",
  "minimum_core_version": "^1.0",
  "namespace": "Modules\\MonModule",
  "provider": "Modules\\MonModule\\Providers\\MonModuleServiceProvider",
  "dependencies": [],
  "provides": ["mon-feature"],
  "permissions": ["mon-module.view", "mon-module.create"],
  "navigation": {
    "app": [
      {
        "title": "Mon Module",
        "icon": "FolderKanban",
        "order": 10,
        "children": [
          {
            "title": "Liste",
            "route": "mon-module.index",
            "icon": "List",
            "order": 1
          }
        ]
      }
    ]
  },
  "widgets": [],
  "metrics": []
}
```

### Regles Importantes

* **Toujours** utiliser `$user->hasPermissionTo()` pour les autorisations, jamais de verification de role
* **Toujours** utiliser le trait `HasTeam` sur les modeles de module
* Les permissions sont globales, les roles sont par equipe
* Les pages de module utilisent les imports `@/` (resolus par Vite)
* `provides` et `permissions` ne peuvent que grandir entre les versions — le `CompatibilityChecker` bloque les mises a jour qui violent ce contrat
* Les routes de module sont automatiquement protegees par `EnsureExtensionEnabled` — les routes desactivees retournent 404

## Signaler un Bug

Ouvrez une issue avec le label `bug` en utilisant le template fourni. Incluez :

* Etapes pour reproduire
* Comportement attendu vs observe
* Version de PHP, Node, et LaStarter
* Captures d'ecran si pertinent

## Proposer une Fonctionnalite

Ouvrez une issue avec le label `enhancement` en decrivant :

* Le besoin ou probleme adresse
* La solution proposee
* Les alternatives envisagees

## Licence

En contribuant a LaStarter, vous acceptez que vos contributions soient sous licence MIT.
