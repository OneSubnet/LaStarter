  CAHIER DES CHARGES — Système de Plugins & Thèmes de Pelican Panel

  ---
  1. Architecture Générale

  1.1 Les 3 catégories d'extensions

  Les extensions sont classées via l'enum app/Enums/PluginCategory.php :

  ┌───────────┬─────────────────────────┬────────────────────────────────────────────────────────────────┐
  │ Catégorie │          Rôle           │                    Comportement spécifique                     │
  ├───────────┼─────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ Plugin    │ Fonctionnalité métier   │ Aucun traitement spécial                                       │
  ├───────────┼─────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ Theme     │ Apparence visuelle      │ Build des assets à l'activation, un seul thème actif à la fois │
  ├───────────┼─────────────────────────┼────────────────────────────────────────────────────────────────┤
  │ Language  │ Traduction/localisation │ Chargement des fichiers de langue                              │
  └───────────┴─────────────────────────┴────────────────────────────────────────────────────────────────┘

  1.2 Cycle de vie d'un plugin

  Les statuts possibles (enum PluginStatus) :

  NotInstalled → Enabled ↔ Disabled
                   ↓
                Errored
                   ↓
             Incompatible

  - NotInstalled : Présent sur le disque mais pas installé
  - Enabled : Actif et chargé
  - Disabled : Installé mais désactivé
  - Errored : Erreur lors du chargement (exception levée)
  - Incompatible : Version du panel non compatible

  ---
  2. Structure d'un Plugin

  2.1 Arborescence complète

  plugins/
  └── mon-plugin/
      ├── plugin.json              ← OBLIGATOIRE — Métadonnées du plugin
      ├── src/
      │   ├── MonPlugin.php        ← OBLIGATOIRE — Classe principale (Filament\Plugin)
      │   ├── Providers/
      │   │   └── MonPluginProvider.php    ← Optionnel — Service Provider Laravel
      │   ├── Filament/
      │   │   ├── Admin/
      │   │   │   ├── Pages/       ← Pages du panel Admin
      │   │   │   ├── Resources/   ← Resources du panel Admin
      │   │   │   └── Widgets/     ← Widgets du panel Admin
      │   │   ├── App/
      │   │   │   ├── Pages/       ← Pages du panel App
      │   │   │   ├── Resources/
      │   │   │   └── Widgets/
      │   │   └── Server/
      │   │       ├── Pages/       ← Pages du panel Server
      │   │       ├── Resources/
      │   │       └── Widgets/
      │   ├── Console/
      │   │   └── Commands/        ← Commandes Artisan personnalisées
      │   ├── Models/              ← Modèles Eloquent du plugin
      │   ├── Services/            ← Logique métier du plugin
      │   └── Http/
      │       └── Middleware/      ← Middleware personnalisé
      ├── config/
      │   └── mon-plugin.php       ← Configuration accessible via config('mon-plugin.*')
      ├── database/
      │   ├── migrations/          ← Migrations Laravel
      │   ├── Factories/           ← Model Factories
      │   └── Seeders/             ← Seeders (exécutés à l'installation)
      ├── resources/
      │   ├── views/               ← Templates Blade
      │   │   └── filament/
      │   │       └── [Panel]/
      │   │           └── Pages/
      │   │               └── page.blade.php
      │   ├── css/                 ← Feuilles de style
      │   └── js/                  ← Scripts JavaScript
      ├── lang/
      │   └── fr/
      │       └── strings.php     ← Traductions
      ├── routes/
      │   ├── web.php              ← Routes web
      │   └── api.php              ← Routes API
      └── composer.json            ← Optionnel — Dépendances Composer du plugin

  2.2 Le fichier plugin.json (OBLIGATOIRE)

  {
      "id": "mon-plugin",
      "name": "Mon Plugin",
      "author": "Auteur",
      "version": "1.0.0",
      "description": "Description du plugin",
      "category": "plugin",
      "url": "https://example.com/mon-plugin",
      "update_url": "https://api.example.com/updates/mon-plugin",
      "namespace": "Vendor\\MonPlugin",
      "class": "MonPlugin",
      "panels": ["admin", "server"],
      "panel_version": "^2.0.0",
      "composer_packages": {
          "vendor/package": "^1.0.0"
      },
      "meta": {
          "status": "enabled",
          "status_message": null,
          "load_order": 0
      }
  }

  Détail des champs :

  ┌───────────────────┬─────────────┬─────────────┬────────────────────────────────┐
  │       Champ       │    Type     │ Obligatoire │          Description           │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ id                │ string      │ Oui         │ Identifiant unique (slug)      │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ name              │ string      │ Oui         │ Nom d'affichage                │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ author            │ string      │ Non         │ Nom de l'auteur                │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ version           │ string      │ Oui         │ Version sémantique (semver)    │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ description       │ string      │ Non         │ Description courte             │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ category          │ string      │ Oui         │ plugin, theme, ou language     │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ url               │ string      │ Non         │ URL du site du plugin          │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ update_url        │ string      │ Non         │ URL de l'API de mise à jour    │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ namespace         │ string      │ Oui         │ Namespace PSR-4 du plugin      │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ class             │ string      │ Oui         │ Nom de la classe principale    │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ panels            │ array|null  │ Non         │ Panels ciblés (null = tous)    │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ panel_version     │ string|null │ Non         │ Contrainte de version du panel │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ composer_packages │ object      │ Non         │ Dépendances Composer           │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ meta.status       │ string      │ Non         │ Statut initial                 │
  ├───────────────────┼─────────────┼─────────────┼────────────────────────────────┤
  │ meta.load_order   │ int         │ Non         │ Ordre de chargement            │
  └───────────────────┴─────────────┴─────────────┴────────────────────────────────┘

  2.3 La classe principale du plugin (OBLIGATOIRE)

  Le fichier src/MonPlugin.php doit implémenter Filament\Contracts\Plugin :

  namespace Vendor\MonPlugin;

  use Filament\Contracts\Plugin;
  use Filament\Panel;

  class MonPlugin implements Plugin
  {
      public function getId(): string
      {
          return 'mon-plugin';
      }

      public function register(Panel $panel): void
      {
          // Découverte automatique des Resources/Pages/Widgets
          $panelId = str($panel->getId())->title(); // "Admin", "App", "Server"

          $panel->discoverPages(
              plugin_path($this->getId(), "src/Filament/{$panelId}/Pages"),
              "Vendor\\MonPlugin\\Filament\\{$panelId}\\Pages"
          );

          $panel->discoverResources(
              plugin_path($this->getId(), "src/Filament/{$panelId}/Resources"),
              "Vendor\\MonPlugin\\Filament\\{$panelId}\\Resources"
          );

          $panel->discoverWidgets(
              plugin_path($this->getId(), "src/Filament/{$panelId}/Widgets"),
              "Vendor\\MonPlugin\\Filament\\{$panelId}\\Widgets"
          );
      }

      public function boot(Panel $panel): void
      {
          // Enregistrement des services, listeners, observers
      }
  }

  ---
  3. Processus de Chargement (PluginService)

  3.1 Séquence de chargement

  Le chargement est initié dans AppServiceProvider@register() via PluginService::loadPlugins() :

  1. Scan du répertoire plugins/
     ↓
  2. Lecture de chaque plugin.json
     ↓
  3. Vérification de compatibilité (panel_version)
     ↓
  4. Enregistrement PSR-4 dans le ClassLoader
     ├── src/ → Namespace\*
     ├── database/Factories/ → Namespace\Database\Factories\*
     └── database/Seeders/ → Namespace\Database\Seeders\*
     ↓
  5. Chargement du fichier config/ (si présent)
     ↓
  6. Chargement des traductions lang/ (si présent)
     ↓
  7. Enregistrement du Service Provider (si présent)
     ↓
  8. Enregistrement des commandes Artisan (si présentes)
     ↓
  9. Enregistrement des migrations (si présentes)
     ↓
  10. Enregistrement des vues (si présentes)
     ↓
  11. Pour chaque panel Filament → loadPanelPlugins()
     ↓
  12. Instanciation de la classe Plugin → register() + boot()

  3.2 Le helper plugin_path()

  plugin_path('mon-plugin')                        // → /var/www/pelican/plugins/mon-plugin
  plugin_path('mon-plugin', 'src/MonPlugin.php')   // → /var/www/pelican/plugins/mon-plugin/src/MonPlugin.php

  3.3 Gestion des assets (Vite)

  Le fichier vite.config.js inclut automatiquement les assets des plugins :

  // Scanne plugins/*/resources/ pour les assets CSS/JS

  Les thèmes déclenchent un yarn build à l'activation via PluginService::buildAssets().

  ---
  4. Installation & Désinstallation

  4.1 Méthodes d'installation

  ┌──────────────┬──────────────────────────────────────────────────────────────┐
  │   Méthode    │                        Point d'entrée                        │
  ├──────────────┼──────────────────────────────────────────────────────────────┤
  │ Upload ZIP   │ POST /api/application/plugins/import/file                    │
  ├──────────────┼──────────────────────────────────────────────────────────────┤
  │ URL distante │ POST /api/application/plugins/import/url                     │
  ├──────────────┼──────────────────────────────────────────────────────────────┤
  │ Manuel       │ Extraction dans plugins/ + php artisan p:plugin:install {id} │
  └──────────────┴──────────────────────────────────────────────────────────────┘

  4.2 Processus d'installation complet

  1. Réception du ZIP (upload ou téléchargement URL)
     ↓
  2. Validation :
     ├── Taille maximale (configurable)
     ├── Protection contre le path traversal
     └── Validation de la structure ZIP
     ↓
  3. Extraction dans plugins/mon-plugin/
     ↓
  4. Lecture et validation du plugin.json
     ↓
  5. Installation des dépendances Composer
     ├── php artisan p:plugin:composer require vendor/package
     └── Consolidation de tous les packages des plugins actifs
     ↓
  6. Build des assets (si thème)
     └── yarn build via PluginService::buildAssets()
     ↓
  7. Exécution des migrations
     └── php artisan migrate --path=plugins/mon-plugin/database/migrations
     ↓
  8. Exécution du seeder (si présent)
     ↓
  9. Activation du plugin (status → Enabled)
     └── Exception : un thème ne s'active pas si un autre thème est déjà actif

  4.3 Processus de désinstallation

  1. Désactivation du plugin
     ↓
  2. Rollback des migrations
     └── php artisan migrate:rollback --path=plugins/mon-plugin/database/migrations
     ↓
  3. Marquage comme Non Installé
     ↓
  4. Suppression des fichiers (optionnel)
     ↓
  5. Rebuild des assets
     ↓
  6. Suppression des packages Composer inutilisés
     ↓
  7. Nettoyage du cache Filament

  4.4 Commandes Artisan disponibles

  ┌─────────────────────────┬───────────────────────────────┐
  │        Commande         │          Description          │
  ├─────────────────────────┼───────────────────────────────┤
  │ p:plugin:make           │ Génère un scaffold de plugin  │
  ├─────────────────────────┼───────────────────────────────┤
  │ p:plugin:list           │ Liste tous les plugins        │
  ├─────────────────────────┼───────────────────────────────┤
  │ p:plugin:install {id}   │ Installe un plugin            │
  ├─────────────────────────┼───────────────────────────────┤
  │ p:plugin:uninstall {id} │ Désinstalle un plugin         │
  ├─────────────────────────┼───────────────────────────────┤
  │ p:plugin:enable {id}    │ Active un plugin              │
  ├─────────────────────────┼───────────────────────────────┤
  │ p:plugin:disable {id}   │ Désactive un plugin           │
  ├─────────────────────────┼───────────────────────────────┤
  │ p:plugin:update {id}    │ Met à jour un plugin          │
  ├─────────────────────────┼───────────────────────────────┤
  │ p:plugin:composer       │ Gère les dépendances Composer │
  └─────────────────────────┴───────────────────────────────┘

  ---
  5. Les 3 Panels Filament & Ciblage

  5.1 Les trois panels

  ┌────────┬──────────────────────┬────────┬──────────────────────────────────────┐
  │ Panel  │        Chemin        │   ID   │             Description              │
  ├────────┼──────────────────────┼────────┼──────────────────────────────────────┤
  │ App    │ /                    │ app    │ Panel utilisateur, topbar uniquement │
  ├────────┼──────────────────────┼────────┼──────────────────────────────────────┤
  │ Admin  │ /admin               │ admin  │ Administration, sidebar avec groupes │
  ├────────┼──────────────────────┼────────┼──────────────────────────────────────┤
  │ Server │ /server/{uuid_short} │ server │ Panel tenant-aware par serveur       │
  └────────┴──────────────────────┴────────┴──────────────────────────────────────┘

  5.2 Ciblage des panels dans un plugin

  Dans plugin.json, le champ panels contrôle le ciblage :

  "panels": ["admin", "server"]   // Uniquement Admin et Server
  "panels": null                   // Tous les panels

  5.3 Conventions de nommage Filament

  src/Filament/Admin/Pages/MaPage.php      → Visible dans /admin
  src/Filament/App/Resources/MaResource.php → Visible dans / (app)
  src/Filament/Server/Widgets/MonWidget.php → Visible dans /server/{uuid}

  5.4 Navigation

  Les Resources et Pages sont automatiquement ajoutées à la navigation du panel via le système de découverte de Filament. Les groupes de navigation sont définis dans chaque Resource/Page :

  protected static ?string $navigationGroup = 'Server Management';

  ---
  6. Le Système de Thèmes

  6.1 Fonctionnement

  Un thème est un plugin avec "category": "theme" dans son plugin.json. Il hérite de toute l'infrastructure plugin classique.

  6.2 Spécificités des thèmes

  - Un seul thème actif à la fois — l'activation d'un thème désactive le précédent
  - Build automatique des assets à l'activation/désactivation
  - Peut modifier : CSS, JavaScript, vues Blade, assets

  6.3 Ce qu'un thème peut personnaliser

  ┌───────────────────┬─────────────────────────────────────────────────────────────────┐
  │      Élément      │                             Méthode                             │
  ├───────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Couleurs          │ Via les render hooks Filament                                   │
  ├───────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Icônes            │ Enregistrement d'icones custom                                  │
  ├───────────────────┼─────────────────────────────────────────────────────────────────┤
  │ CSS               │ Fichiers dans resources/css/, compilés par Vite                 │
  ├───────────────────┼─────────────────────────────────────────────────────────────────┤
  │ JavaScript        │ Fichiers dans resources/js/                                     │
  ├───────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Vues Blade        │ Surcharges dans resources/views/                                │
  ├───────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Layout            │ Render hooks (PAGE_START, FOOTER, STYLES_BEFORE, SCRIPTS_AFTER) │
  ├───────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Footer            │ Hook FOOTER                                                     │
  ├───────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Bannière d'alerte │ Hook PAGE_START                                                 │
  └───────────────────┴─────────────────────────────────────────────────────────────────┘

  6.4 Exemple minimal de thème

  plugins/mon-theme/
  ├── plugin.json
  └── src/
      └── MonTheme.php

  {
      "id": "mon-theme",
      "name": "Mon Thème",
      "version": "1.0.0",
      "category": "theme",
      "namespace": "Vendor\\MonTheme",
      "class": "MonTheme"
  }

  class MonTheme implements Plugin
  {
      public function getId(): string { return 'mon-theme'; }

      public function register(Panel $panel): void
      {
          // Enregistrement des assets CSS/JS via Vite
      }

      public function boot(Panel $panel): void {}
  }

  6.5 Palette de couleurs par défaut (FilamentServiceProvider)

  ┌─────────┬─────────────────┬────────────────────────┐
  │ Couleur │       Hex       │         Usage          │
  ├─────────┼─────────────────┼────────────────────────┤
  │ Primary │ #3B82F6 (Blue)  │ Éléments principaux    │
  ├─────────┼─────────────────┼────────────────────────┤
  │ Danger  │ #EF4444 (Red)   │ Erreurs, suppressions  │
  ├─────────┼─────────────────┼────────────────────────┤
  │ Success │ #10B981 (Green) │ Succès, confirmations  │
  ├─────────┼─────────────────┼────────────────────────┤
  │ Warning │ #F59E0B (Amber) │ Avertissements         │
  ├─────────┼─────────────────┼────────────────────────┤
  │ Info    │ #3B82F6 (Sky)   │ Informations           │
  ├─────────┼─────────────────┼────────────────────────┤
  │ Blurple │ #5865F2         │ Couleur custom Discord │
  └─────────┴─────────────────┴────────────────────────┘

  ---
  7. Le Système d'Extensions (app/Extensions/)

  7.1 Architecture

  Chaque type d'extension suit le même pattern :

  Interface (SchemaInterface)
      └── Implémentations concrètes (Schemas)
              ↕
      Service (ExtensionService)
          ├── Enregistrement des schemas
          ├── Récupération du schema actif
          └── Appel des méthodes du schema

  7.2 Les 6 types d'extensions

  ┌───────────┬────────────────────────┬────────────────┬────────────────────────────────────────────────────────────────┐
  │ Extension │       Interface        │    Service     │                        Implémentations                         │
  ├───────────┼────────────────────────┼────────────────┼────────────────────────────────────────────────────────────────┤
  │ OAuth     │ OAuthSchemaInterface   │ OAuthService   │ Google, GitHub, Discord, Facebook, Steam, etc.                 │
  ├───────────┼────────────────────────┼────────────────┼────────────────────────────────────────────────────────────────┤
  │ Avatar    │ AvatarSchemaInterface  │ AvatarService  │ Gravatar, UiAvatars                                            │
  ├───────────┼────────────────────────┼────────────────┼────────────────────────────────────────────────────────────────┤
  │ Captcha   │ CaptchaSchemaInterface │ CaptchaService │ Cloudflare Turnstile                                           │
  ├───────────┼────────────────────────┼────────────────┼────────────────────────────────────────────────────────────────┤
  │ Tasks     │ TaskSchemaInterface    │ TaskService    │ CreateBackup, DeleteFiles, PowerAction, SendCommand            │
  ├───────────┼────────────────────────┼────────────────┼────────────────────────────────────────────────────────────────┤
  │ Features  │ FeatureSchemaInterface │ FeatureService │ JavaVersion, MinecraftEula, GSLToken, PIDLimit, SteamDiskSpace │
  ├───────────┼────────────────────────┼────────────────┼────────────────────────────────────────────────────────────────┤
  │ Backups   │ —                      │ BackupManager  │ S3, Local                                                      │
  └───────────┴────────────────────────┴────────────────┴────────────────────────────────────────────────────────────────┘

  7.3 Chaque Schema fournit

  - Un identifiant unique
  - Un nom d'affichage
  - Un formulaire de configuration (Filament Form)
  - Une logique d'activation/désactivation

  7.4 Relation avec les plugins

  Les extensions intégrées (app/Extensions/) sont des fonctionnalités natives du panel. Les plugins peuvent créer de nouvelles implémentations de ces interfaces pour étendre le panel (ex: ajouter un provider OAuth custom).

  ---
  8. Paramètres de Plugin (Settings)

  8.1 Interface HasPluginSettings

  Un plugin qui nécessite des paramètres admin doit implémenter cette interface :

  interface HasPluginSettings
  {
      public function getSettingsForm(): array;    // Formulaire Filament
      public function saveSettings(array $data): void;  // Sauvegarde
  }

  8.2 Stockage

  Les paramètres sont stockés de manière propre à chaque plugin. Exemples :
  - Fichier .env via EnvironmentWriterTrait
  - Base de données via des models/migrations custom
  - Fichier config via config/mon-plugin.php

  8.3 Affichage

  Les paramètres apparaissent automatiquement dans l'interface d'administration des plugins (/admin/plugins).

  ---
  9. API REST pour la gestion des plugins

  9.1 Endpoints disponibles

  Tous les endpoints sont sous /api/application/plugins avec authentification admin :

  ┌─────────┬─────────────────────┬────────────────────────┐
  │ Méthode │        Route        │      Description       │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ GET     │ /                   │ Liste tous les plugins │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ GET     │ /{plugin}           │ Détails d'un plugin    │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ POST    │ /import/file        │ Upload ZIP             │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ POST    │ /import/url         │ Import depuis URL      │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ POST    │ /{plugin}/install   │ Installer              │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ POST    │ /{plugin}/update    │ Mettre à jour          │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ POST    │ /{plugin}/uninstall │ Désinstaller           │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ POST    │ /{plugin}/enable    │ Activer                │
  ├─────────┼─────────────────────┼────────────────────────┤
  │ POST    │ /{plugin}/disable   │ Désactiver             │
  └─────────┴─────────────────────┴────────────────────────┘

  9.2 Routes personnalisées

  Un plugin peut déclarer ses propres routes dans routes/web.php et routes/api.php. Elles sont chargées automatiquement via le Service Provider du plugin.

  ---
  10. Stockage des Données Plugin

  10.1 Modèle Plugin

  Le model App\Models\Plugin utilise le package Sushi pour lire directement les fichiers plugin.json du filesystem — pas de table SQL dédiée.

  10.2 Migrations

  Chaque plugin peut fournir ses propres migrations dans database/migrations/. Elles sont exécutées à l'installation et rollbackées à la désinstallation.

  10.3 Modèles personnalisés

  Les plugins peuvent définir des models Eloquent dans src/Models/ avec les migrations associées.

  ---
  11. Configuration Globale (config/panel.php)

  ┌─────────────────────────────┬─────────────────────────┬───────────────────────────────────────┐
  │             Clé             │       Description       │            Impact plugins             │
  ├─────────────────────────────┼─────────────────────────┼───────────────────────────────────────┤
  │ filament.display-width      │ Largeur max du contenu  │ Affecte le layout de tous les plugins │
  ├─────────────────────────────┼─────────────────────────┼───────────────────────────────────────┤
  │ filament.avatar-provider    │ Provider d'avatar actif │ Peut être étendu par plugins          │
  ├─────────────────────────────┼─────────────────────────┼───────────────────────────────────────┤
  │ filament.uploadable-avatars │ Avatars uploadables     │ —                                     │
  ├─────────────────────────────┼─────────────────────────┼───────────────────────────────────────┤
  │ filament.default-navigation │ Navigation par défaut   │ Affecte l'affichage des plugins       │
  ├─────────────────────────────┼─────────────────────────┼───────────────────────────────────────┤
  │ plugin.dev_mode             │ Mode développement      │ Affiche les erreurs détaillées        │
  └─────────────────────────────┴─────────────────────────┴───────────────────────────────────────┘

  ---
  12. Frontend & Build

  12.1 Stack technique

  - Vite 7 — Build tool
  - Tailwind CSS 4 — Framework CSS
  - xterm.js — Console serveur
  - Monaco Editor — Éditeur de code
  - Blade — Templates

  12.2 Assets des plugins

  Les assets situés dans plugins/*/resources/ sont automatiquement inclus dans le build Vite. Un yarn build recompile tous les assets, y compris ceux des plugins.

  12.3 Hooks de rendu Filament

  ┌───────────────┬──────────────────────┬──────────────────────────┐
  │     Hook      │     Emplacement      │          Usage           │
  ├───────────────┼──────────────────────┼──────────────────────────┤
  │ PAGE_START    │ Début de page        │ Bannières d'alerte       │
  ├───────────────┼──────────────────────┼──────────────────────────┤
  │ FOOTER        │ Pied de page         │ Branding, scripts custom │
  ├───────────────┼──────────────────────┼──────────────────────────┤
  │ STYLES_BEFORE │ Avant les styles CSS │ CSS custom               │
  ├───────────────┼──────────────────────┼──────────────────────────┤
  │ SCRIPTS_AFTER │ Après les scripts JS │ JS custom                │
  └───────────────┴──────────────────────┴──────────────────────────┘

  ---
  13. Limitations Actuelles

  ┌──────────────────────────────────┬─────────────────────────────────────────────────────────────┐
  │              Limite              │                           Détail                            │
  ├──────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Pas de marketplace               │ Pas de système de découverte de plugins distant             │
  ├──────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Pas de dépendances inter-plugins │ Pas de résolution automatique des dépendances               │
  ├──────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Pas d'événements plugin          │ Pas de système d'events/webhooks pour le cycle de vie       │
  ├──────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Pas de permissions dédiées       │ Utilise uniquement l'autorisation Laravel standard          │
  ├──────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Pas de rollback automatique      │ Pas de mécanisme de retour arrière si l'installation échoue │
  ├──────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Pas de monitoring                │ Pas de surveillance de la santé des plugins                 │
  ├──────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ Thème unique                     │ Un seul thème actif simultanément                           │
  └──────────────────────────────────┴─────────────────────────────────────────────────────────────┘

  ---
  14. Diagramme Résumé de l'Architecture

  ┌─────────────────────────────────────────────────────┐
  │                    Pelican Panel                      │
  ├─────────────────────────────────────────────────────┤
  │                                                       │
  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
  │  │  App Panel  │  │ Admin Panel │  │ Server Panel │ │
  │  │     /       │  │   /admin    │  │  /server/*   │ │
  │  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘ │
  │         │                │                 │          │
  │         └────────────────┼─────────────────┘          │
  │                          │                             │
  │                  ┌───────┴───────┐                     │
  │                  │ PluginService │                     │
  │                  │  (chargement) │                     │
  │                  └───────┬───────┘                     │
  │                          │                             │
  │         ┌────────────────┼────────────────┐            │
  │         │                │                │            │
  │  ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐     │
  │  │  Plugins/   │ │   Themes/   │ │  Languages/ │     │
  │  │ Fonctionnal.│ │ Apparence   │ │ Traductions │     │
  │  └──────┬──────┘ └──────┬──────┘ └─────────────┘     │
  │         │               │                              │
  │         └───────┬───────┘                              │
  │                 │                                      │
  │  ┌──────────────┴──────────────┐                      │
  │  │      Extensions natives     │                      │
  │  ├─────────────────────────────┤                      │
  │  │ OAuth │ Avatar │ Captcha    │                      │
  │  │ Tasks │ Features │ Backups  │                      │
  │  └─────────────────────────────┘                      │
  │                                                       │
  │  ┌─────────────────────────────┐                      │
  │  │     API REST (/api/)        │                      │
  │  │  client │ application │ daemon│                     │
  │  └─────────────────────────────┘                      │
  │                                                       │
  │  ┌─────────────────────────────┐                      │
  │  │   Frontend (Vite+Tailwind)  │                      │
  │  │  Assets panel + plugins     │                      │
  │  └─────────────────────────────┘                      │
  └─────────────────────────────────────────────────────┘