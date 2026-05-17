# Contribuer a LaStarter

Merci de votre interet pour LaStarter ! Ce document decrit les guidelines pour contribuer au projet.

## Installation pour le developpement

1. Forkez et clonez le depot
2. Lancez `composer setup` pour une installation complete
3. Copiez `.env.example` vers `.env` et configurez votre base de donnees
4. Lancez `composer dev` pour demarrer le serveur de developpement

## Style de code

### PHP
- Suivre les standards PSR-12
- Lancer `composer run lint` pour auto-fixer avec Pint
- Lancer `composer run lint:check` pour verifier sans modifier

### TypeScript / React
- Suivre la configuration ESLint + Prettier existante
- Lancer `npm run lint` pour auto-fixer
- Lancer `npm run format` pour formater avec Prettier
- Lancer `npm run types:check` pour verifier les types TypeScript

## Nommage des branches

- `feature/` — nouvelles fonctionnalites (ex : `feature/extension-marketplace`)
- `fix/` — corrections de bugs (ex : `fix/team-switching-redirect`)
- `docs/` — changements de documentation (ex : `docs/update-readme`)
- `refactor/` — refactoring de code (ex : `refactor/extract-actions`)

## Messages de commit

Ecrire des messages clairs et descriptifs qui expliquent le **pourquoi** et non le **quoi** :

```
Add signed URL downloads for backup files

Backups are now downloaded via HMAC-SHA256 signed URLs with encrypted
payloads instead of direct session-auth routes. This allows downloads
without active sessions and supports expiration.
```

## Tests

Toute contribution doit inclure les tests appropries :

- **Tests PHP** : Utiliser Pest. Lancer `composer run test`
- **Tests d'autorisation** : Chaque verification de permission doit avoir un test
- **Tests d'integration** : Les changements de fonctionnalite doivent avoir des tests HTTP
- **Verification de types** : Lancer `npm run types:check` — zero erreur requise

## Processus de Pull Request

1. Creer une branche feature depuis `main`
2. Faire les changements avec les tests appropries
3. S'assurer que tous les checks passent :
   - `composer run lint:check` — zero warning
   - `composer run test` — zero echec
   - `npm run types:check` — zero erreur
   - `npm run lint` — zero erreur
4. Ouvrir une PR avec une description claire du changement et de sa justification
5. Repondre aux retours de review

## Guidelines d'architecture

- **Le backend est la source de verite** — le frontend ne fait que refleter l'etat
- **Ne jamais hardcoder de noms de roles** — utiliser `hasPermissionTo()` et les Policies
- **Ne jamais mettre de logique metier dans les controleurs** — utiliser des classes Action
- **Ne jamais faire de requetes DB dans les vues/layouts/navigation** — resoudre le contexte en amont
- **Utiliser les Form Requests** pour toute validation non-triviale
- **Utiliser le trait `HasTeam`** sur tous les modeles de module pour le scope automatique
- **Aucun texte hardcode** — utiliser le systeme de traduction `__()` (backend) et `t()` (frontend)
- **Classes finales** — utiliser `final class` pour les controleurs, services et actions
- **Inertia::flash()** pour les toasts — ne pas utiliser `->with()` qui ne declenche pas l'event frontend

## Contributions d'extensions

Les extensions sont developpees dans le depot [LaStarter-Marketplace](https://github.com/OneSubnet/LaStarter-Marketplace). Chaque extension doit :

1. Avoir un manifeste `extension.json` valide (voir le schema JSON dans `schemas/extension.schema.json`)
2. Utiliser un ServiceProvider etendant `ModuleServiceProvider`
3. Inclure des modeles avec le trait `HasTeam`
4. Definir les permissions dans le manifeste
5. Inclure une Policy utilisant `hasPermissionTo()`
6. Fournir les traductions dans `resources/locales/{locale}.json`
7. Valider la compatibilite — `provides` et `permissions` ne peuvent que grandir, jamais diminuer

Voir CLAUDE.md pour le guide complet de developpement d'extensions.

## Questions ?

Ouvrez une issue sur GitHub pour les bugs, demandes de fonctionnalites ou questions.
