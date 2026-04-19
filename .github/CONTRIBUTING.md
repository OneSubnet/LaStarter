# Guide de Contribution

Merci de votre intérêt pour LaStarter ! Ce document vous guidera dans le processus de contribution.

## Développement Local

### Prérequis

* PHP 8.2+
* Node.js 18+
* Composer
* SQLite (pour les tests) ou MySQL/PostgreSQL

### Installation

```bash
git clone https://github.com/OneSubnet/LaStarter.git
cd LaStarter
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm run build
composer dev
```

### Commandes Utiles

```bash
composer dev          # Démarrer le serveur + queue + Vite
composer run lint     # Pint (PHP)
composer run test     # Pint check + Pest
npm run dev           # Vite dev server
npm run lint          # ESLint
npm run types:check   # TypeScript check
```

## Processus de Contribution

### 1. Fork & Branch

```bash
# Fork le dépôt sur GitHub, puis :
git clone https://github.com/VOTRE-USER/LaStarter.git
cd LaStarter
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 2. Développement

* Suivez les conventions de code existantes
* Ajoutez des tests pour les nouvelles fonctionnalités
* Assurez-vous que `composer run lint` et `npm run types:check` passent

### 3. Commit

Utilisez des messages de commit clairs et descriptifs en français ou anglais :

```
feat: ajout du module de formulaires
fix: correction de la pagination sur la page des extensions
docs: mise à jour du guide d'extension
```

### 4. Pull Request

* Ouvrez une PR vers la branche `main`
* Décrivez clairement les changements effectués
* Référencez les issues concernées
* Assurez-vous que les checks CI passent

## Créer une Extension

LaStarter supporte deux types d'extensions : les **modules** (logique métier) et les **thèmes** (surcharges UI).

### Structure d'un Module

```
extensions/modules/{slug}/
├── extension.json           # Manifeste obligatoire
├── src/
│   ├── {Name}ServiceProvider.php
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
    └── js/
        └── pages/
```

### Manifeste (extension.json)

```json
{
    "identifier": "mon-module",
    "name": "Mon Module",
    "type": "module",
    "version": "1.0.0",
    "description": "Description du module",
    "author": "Votre Nom",
    "provider": "Modules\\MonModule\\MonModuleServiceProvider",
    "namespace": "Modules\\MonModule",
    "lastarterVersion": ">=1.0.0",
    "permissions": ["mon-module.view", "mon-module.create"],
    "navigation": {
        "app": [{
            "title": "Mon Module",
            "icon": "FolderKanban",
            "route": "mon-module.index",
            "permission": "mon-module.view",
            "order": 10
        }]
    },
    "settings": []
}
```

### Règles Importantes

* **Toujours** utiliser `$user->hasPermissionTo()` pour les autorisations, jamais de vérification de rôle
* **Toujours** utiliser le trait `HasTeam` sur les modèles de module
* Les permissions sont globales, les rôles sont par équipe
* Les pages de module utilisent les imports `@/` (résolus par Vite)

## Signaler un Bug

Ouvrez une issue avec le label `bug` en utilisant le template fourni. Incluez :

* Étapes pour reproduire
* Comportement attendu vs observé
* Version de PHP, Node, et LaStarter
* Captures d'écran si pertinent

## Proposer une Fonctionnalité

Ouvrez une issue avec le label `enhancement` en décrivant :

* Le besoin ou problème adressé
* La solution proposée
* Les alternatives envisagées

## Licence

En contribuant à LaStarter, vous acceptez que vos contributions soient sous licence MIT.
