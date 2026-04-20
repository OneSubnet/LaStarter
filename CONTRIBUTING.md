# Contribuer à LaStarter

Merci de votre intérêt pour LaStarter ! Ce document décrit les guidelines pour contribuer au projet.

## Installation pour le développement

1. Forkez et clonez le dépôt
2. Lancez `composer setup` pour une installation complète
3. Copiez `.env.example` vers `.env` et configurez votre base de données
4. Lancez `composer dev` pour démarrer le serveur de développement

## Style de code

### PHP
- Suivre les standards PSR-12
- Lancer `composer run lint` pour auto-fixer avec Pint
- Lancer `composer run lint:check` pour vérifier sans modifier

### TypeScript / React
- Suivre la configuration ESLint + Prettier existante
- Lancer `npm run lint` pour auto-fixer
- Lancer `npm run format` pour formater avec Prettier
- Lancer `npm run types:check` pour vérifier les types TypeScript

## Nommage des branches

- `feature/` — nouvelles fonctionnalités (ex : `feature/extension-marketplace`)
- `fix/` — corrections de bugs (ex : `fix/team-switching-redirect`)
- `docs/` — changements de documentation (ex : `docs/update-readme`)
- `refactor/` — refactoring de code (ex : `refactor/extract-actions`)

## Messages de commit

Écrire des messages clairs et descriptifs qui expliquent le **pourquoi** et non le **quoi** :

```
Add extension lifecycle states for better module management

Extensions now track their state (enabled, disabled, errored, incompatible)
instead of a simple boolean. This allows better UX and error recovery.
```

## Tests

Toute contribution doit inclure les tests appropriés :

- **Tests PHP** : Utiliser Pest. Lancer `composer run test`
- **Tests d'autorisation** : Chaque vérification de permission doit avoir un test
- **Tests d'intégration** : Les changements de fonctionnalité doivent avoir des tests HTTP
- **Vérification de types** : Lancer `npm run types:check` — zéro erreur requise

## Processus de Pull Request

1. Créer une branche feature depuis `main`
2. Faire les changements avec les tests appropriés
3. S'assurer que tous les checks passent :
   - `composer run lint:check` — zéro warning
   - `composer run test` — zéro échec
   - `npm run types:check` — zéro erreur
   - `npm run lint` — zéro erreur
4. Ouvrir une PR avec une description claire du changement et de sa justification
5. Répondre aux retours de review

## Guidelines d'architecture

- **Le backend est la source de vérité** — le frontend ne fait que refléter l'état
- **Ne jamais hardcoder de noms de rôles** — utiliser `hasPermissionTo()` et les Policies
- **Ne jamais mettre de logique métier dans les contrôleurs** — utiliser des classes Action
- **Ne jamais faire de requêtes DB dans les vues/layouts/navigation** — résoudre le contexte en amont
- **Utiliser les Form Requests** pour toute validation non-triviale
- **Utiliser le trait `HasTeam`** sur tous les modèles de module pour le scope automatique
- **Aucun texte hardcodé** — utiliser le système de traduction `__()` (backend) et `t()` (frontend)

## Contributions d'extensions

Les extensions sont développées dans le dépôt [LaStarter-Marketplace](https://github.com/OneSubnet/LaStarter-Marketplace). Chaque extension doit :

1. Avoir un manifeste `extension.json` valide
2. Utiliser un ServiceProvider étendant `ModuleServiceProvider`
3. Inclure des modèles avec le trait `HasTeam`
4. Définir les permissions dans le manifeste
5. Inclure une Policy utilisant `hasPermissionTo()`
6. Fournir les traductions dans `resources/locales/{locale}.json`

Voir CLAUDE.md pour le guide complet de développement d'extensions.

## Questions ?

Ouvrez une issue sur GitHub pour les bugs, demandes de fonctionnalités ou questions.
