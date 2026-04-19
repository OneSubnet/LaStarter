Bien.  
Je te fais un **document unique**, **prêt à copier-coller**, que tu peux envoyer directement à ton agent IA.

Je vais le structurer pour qu’il serve **à la fois** de :

- **cahier des charges**
- **cadre technique**
- **liste des règles obligatoires**
- **matrice utiliser / ne pas utiliser**
- **définition du résultat attendu**
- **format de réponse obligatoire de l’agent**

Comme ça, tu n’as **qu’un seul document** à transmettre.

---

# **DOCUMENT UNIQUE — CADRE DIRECTEUR PROJET LASTARTER**
## **Spécification technique + règles obligatoires + format de réponse attendu pour agent IA**

---

## **1. Objet du document**

Ce document définit le cadre complet du projet **LaStarter**.

Il doit être utilisé comme :

- document directeur,
- base d’analyse,
- cadre de faisabilité,
- cahier des charges technique,
- référentiel de conformité,
- support d’échange avec un agent IA ou une équipe de développement.

Ce document ne demande pas une implémentation rapide ou bricolée.  
Il impose la construction d’une base applicative :

- propre,
- modulaire,
- maintenable,
- testable,
- évolutive,
- idiomatique Laravel,
- exploitable à long terme.

---

## **2. Contexte**

Le projet **LaStarter** doit être conçu comme un **socle applicatif modulaire** orienté :

- organisations,
- memberships,
- équipes / espaces,
- rôles,
- permissions,
- capacités réelles,
- navigation contextualisée,
- modules activables,
- UI pilotée par autorisations calculées,
- extensibilité long terme.

Le projet ne doit **pas** être traité comme :

- un simple CRUD admin,
- un panel monolithique,
- un assemblage de contrôleurs,
- un système de rôles codé en dur,
- une application où le frontend décide de la sécurité,
- une base de code opportuniste ou non factorisée.

Le projet doit au contraire être traité comme :

> une base produit sérieuse,  
> une architecture modulaire,  
> un backend source de vérité,  
> un frontend de restitution,  
> un système de contexte explicite,  
> et une fondation durable pour des extensions futures.

---

## **3. Contrainte de départ**

La starter Laravel / React existe déjà.  
Il n’est donc **pas nécessaire** de redéfinir la stack de base.

L’analyse et l’implémentation doivent partir du principe que :

- le socle Laravel 13 existe déjà,
- le frontend React existe déjà,
- l’objectif n’est pas de réinventer la base,
- l’objectif est de structurer correctement ce qui doit être construit dessus.

L’agent IA doit donc :

- analyser la base existante,
- identifier les écarts,
- vérifier la faisabilité,
- proposer une architecture conforme,
- signaler ce qui doit être conservé,
- signaler ce qui doit être refactoré,
- signaler ce qui doit être refusé.

---

## **4. Vision produit**

LaStarter doit permettre de construire une application capable de gérer proprement :

- plusieurs organisations,
- plusieurs memberships par utilisateur,
- plusieurs équipes / espaces selon contexte,
- des rôles et permissions non hardcodés,
- des capacités calculées dynamiquement,
- une navigation dépendante du contexte,
- des modules activables ou désactivables,
- des écrans et actions pilotés par autorisation réelle,
- une architecture extensible sans dette structurelle immédiate.

Le projet doit être pensé dès le départ comme une base qui pourra évoluer sans nécessiter une réécriture complète de l’autorisation, de la navigation ou du contexte applicatif.

---

## **5. Doctrine générale obligatoire**

### **5.1 Doctrine de conception**

L’implémentation doit respecter les principes suivants :

- clean code obligatoire,
- POO claire,
- responsabilités séparées,
- conventions stables,
- composition plutôt que duplication,
- explicitation des responsabilités,
- code testable,
- architecture lisible,
- modularité,
- réutilisabilité,
- absence de logique opportuniste,
- absence de hardcode métier.

### **5.2 Doctrine backend / frontend**

Le backend est la **source de vérité**.

Le frontend :

- ne décide pas des règles métier,
- ne décide pas des autorisations réelles,
- ne remplace pas la sécurité serveur,
- ne doit que refléter un état déjà résolu.

Le frontend peut :

- afficher,
- masquer,
- désactiver,
- contextualiser,
- ordonner,
- guider l’utilisateur,

mais uniquement à partir de données et capacités fiables fournies par le backend.

### **5.3 Doctrine Laravel**

Le projet doit rester **idiomatique Laravel**.  
Il faut utiliser les mécanismes natifs du framework quand ils répondent correctement au besoin.

Toute réinvention custom d’un mécanisme Laravel déjà adapté doit être considérée comme suspecte et doit être justifiée.

---

## **6. Objectif principal**

Concevoir et implémenter une base applicative modulaire permettant :

1. de gérer des organisations,
2. de gérer les appartenances utilisateur,
3. de gérer des équipes / espaces,
4. de gérer des rôles, permissions et capacités,
5. de centraliser les décisions d’autorisation,
6. de résoudre proprement un contexte courant,
7. de générer une navigation propre et contextualisée,
8. d’activer ou désactiver des modules sans hardcode dispersé,
9. d’exposer au frontend uniquement les capacités déjà calculées,
10. de conserver une architecture propre, durable et testable.

---

## **7. Résultat attendu**

Le résultat final attendu doit permettre de constater que :

- une action sensible peut être protégée sans hardcode de rôle ;
- une route peut être autorisée/refusée sans logique dispersée ;
- une URL contextualisée peut être générée sans requête DB dans le rendu ;
- la navigation peut dépendre du contexte sans chargement tardif bricolé ;
- l’UI peut afficher ou masquer une action à partir de capacités réelles ;
- l’ajout d’une permission ou d’un module n’oblige pas à retoucher toute la codebase ;
- les responsabilités sont bien séparées ;
- l’architecture reste propre à long terme ;
- le code est refactorable sans effet domino massif ;
- les parties critiques sont testées.

---

## **8. Contraintes absolues non négociables**

Les éléments suivants sont strictement interdits.

### **8.1 Interdictions métier**

- hardcoder des rôles textuels dans la logique métier,
- écrire des conditions du type `admin`, `owner`, `super_admin`, etc. directement dans la logique d’accès,
- baser la sécurité sur des booléens UI,
- disperser la logique d’accès dans plusieurs couches.

### **8.2 Interdictions backend**

- mettre la logique métier principale dans les contrôleurs,
- faire de la validation inline partout,
- propager des tableaux de données non filtrés dans le domaine,
- utiliser des helpers globaux métier non maîtrisés,
- utiliser des `try/catch` pour masquer un défaut structurel,
- réinventer inutilement des mécanismes Laravel natifs,
- construire une sécurité “maison” parallèle sans justification forte.

### **8.3 Interdictions frontend**

- décider de l’autorisation réelle dans React,
- dupliquer les règles backend côté frontend,
- reconstruire le contexte métier dans les composants,
- faire de la sécurité réelle dans les composants UI,
- mettre de la logique métier lourde dans les hooks ou composants.

### **8.4 Interdictions navigation / contexte**

- faire des requêtes DB dans les vues,
- faire des requêtes DB dans les menus,
- faire des requêtes DB dans les layouts,
- faire des requêtes DB dans les breadcrumbs,
- faire des requêtes DB dans les composants de rendu pour construire une URL,
- faire un chargement tardif d’entité uniquement pour résoudre un slug,
- utiliser des fallback bricolés du type `slug ?? id`,
- compenser un contexte mal résolu avec du code opportuniste.

### **8.5 Interdictions d’architecture**

- duplication massive,
- couplage fort non justifié,
- classes “god object”,
- middleware monstrueux qui gèrent tout,
- services fourre-tout,
- logique implicite difficile à tester,
- architecture qui dépend du hasard de l’ordre d’exécution.

---

## **9. Architecture fonctionnelle cible**

Le système doit être pensé autour de blocs conceptuels explicites :

- **Auth / Identity**
- **Organizations**
- **Memberships**
- **Teams / Spaces**
- **Roles / Permissions / Capabilities**
- **Current Context**
- **Navigation Registry**
- **Modules / Feature Flags**
- **Audit / Observability**
- **UI Capability Exposure**

Chaque bloc doit avoir :

- une responsabilité claire,
- des frontières compréhensibles,
- un rôle défini,
- des interactions limitées et explicites.

Aucune couche ne doit compenser le flou d’une autre.

---

## **10. Règles Laravel obligatoires**

### **10.1 Autorisation**

Toute décision d’accès serveur doit passer par une logique centralisée et structurée.

Il faut privilégier :

- Policies,
- Gates,
- logique d’autorisation dédiée,
- mécanismes d’autorisation cohérents avec Laravel.

Interdictions :

- logique d’accès dispersée dans les contrôleurs,
- sécurité portée par l’UI,
- conditions hardcodées dans le rendu.

### **10.2 Validation**

Toute entrée HTTP métier non triviale doit être traitée proprement.

À privilégier :

- Form Requests,
- validation centralisée,
- données validées et filtrées avant usage métier.

Interdictions :

- validations massives inline,
- `request()->all()` envoyé directement dans le domaine,
- logique de sécurité mélangée au contrôleur sans structure.

### **10.3 Container / injection**

Le projet doit utiliser l’injection de dépendances de manière propre.

À respecter :

- dépendances explicites,
- services injectés,
- container Laravel utilisé correctement,
- providers quand nécessaire.

Interdictions :

- accès global systématique à tout depuis partout,
- service locator déguisé,
- statiques utilitaires omniprésentes.

### **10.4 Middleware**

Les middleware doivent rester ciblés.

Ils peuvent gérer :

- préconditions transverses,
- contexte d’entrée,
- contrôle standardisé.

Ils ne doivent pas devenir :

- le cœur du métier,
- un fourre-tout auth + ACL + contexte + rendu + navigation.

### **10.5 Contexte courant**

Le système doit reposer sur un **contexte courant explicite**.

Ce contexte doit permettre de connaître proprement selon les cas :

- utilisateur courant,
- organisation courante,
- membership courant,
- équipe / espace courant,
- capacités disponibles,
- module actif si nécessaire.

Le contexte doit être résolu de manière fiable en amont, pas bricolé au moment du rendu.

### **10.6 Génération d’URL**

La génération des URLs doit reposer sur un contexte déjà connu.

Interdictions absolues :

- récupérer une entité dans la navigation pour fabriquer une route,
- charger un modèle dans un composant pour obtenir un slug,
- utiliser des fallbacks silencieux faute d’architecture propre.

### **10.7 Feature flags / modules**

L’activation ou désactivation des modules/features doit être centralisée.

Interdictions :

- booléens dispersés partout,
- règles de plan / module écrites dans toute la codebase,
- logique de feature cachée dans l’UI.

### **10.8 Auth API / SPA**

Si des besoins API / SPA existent, ils doivent utiliser une approche Laravel cohérente.

Interdictions :

- système custom de token sans besoin réel,
- double système auth non maîtrisé.

### **10.9 Observabilité**

Les actions sensibles doivent être traçables.

Le système doit pouvoir corréler proprement :

- acteur,
- organisation,
- contexte courant,
- action,
- module,
- requête,
- identifiant de trace si nécessaire.

### **10.10 Déploiement**

Le projet doit être compatible avec une exécution propre en production.

Il doit éviter :

- les comportements dépendants d’un environnement fragile,
- les conventions incompatibles avec les optimisations standard Laravel,
- les dépendances implicites non contrôlées.

---

## **11. Doctrine ORM / accès données**

Le projet doit utiliser proprement l’ORM Laravel sans transformer les modèles en zone de chaos métier.

Règles :

- les modèles ne doivent pas devenir le dépôt unique de toute la logique métier ;
- les relations ne doivent pas cacher des comportements massifs incontrôlés ;
- le rendu UI ne doit pas déclencher des requêtes de contexte ;
- les lectures nécessaires doivent être explicites et prévisibles ;
- il faut éviter les comportements magiques qui masquent les vrais besoins applicatifs.

L’accès aux données doit rester :

- lisible,
- maîtrisé,
- prévisible,
- testable,
- compatible avec une architecture propre.

---

## **12. Frontend / composants / hooks / design system**

Le frontend doit être conçu comme une couche propre de restitution.

### **12.1 Exigences**

- composants réutilisables,
- hooks réutilisables,
- conventions stables,
- séparation nette entre donnée, capacité et rendu,
- design system cohérent,
- structure claire des composants.

### **12.2 Interdictions**

- faire porter au frontend la vérité métier,
- faire recalculer les droits par l’UI,
- disséminer les règles d’accès dans les composants,
- transformer les hooks en services métiers cachés,
- créer des composants impossibles à réutiliser.

### **12.3 Résultat attendu**

Le frontend doit consommer :

- des données prêtes,
- des capacités prêtes,
- un contexte prêt,

et non reconstruire lui-même ce qui aurait dû être résolu côté serveur.

---

## **13. Modules et extensibilité**

Le projet doit pouvoir grandir sans casser sa structure.

L’ajout d’un module, d’une permission, d’un écran, d’un type d’accès ou d’un comportement lié au contexte ne doit pas provoquer :

- une modification partout,
- une multiplication de conditions en dur,
- une réécriture du système d’autorisation,
- une dette immédiate sur la navigation ou l’UI.

Le système doit donc être conçu pour accepter l’évolution avec un coût raisonnable et sans dérive structurelle.

---

## **14. Qualité de code attendue**

Le niveau de qualité attendu est élevé.

Le code doit être :

- lisible,
- explicite,
- cohérent,
- factorisé,
- testable,
- maintenable,
- stable,
- aligné avec les conventions choisies.

Sont attendus :

- nommage clair,
- découpage cohérent,
- services ciblés,
- logique localisée au bon endroit,
- composants propres,
- conventions répétables,
- faible ambiguïté.

Sont refusés :

- duplication,
- conditions magiques,
- code opportuniste,
- architecture “ça marche donc c’est bon”,
- mélange des responsabilités,
- logique cachée.

---

## **15. Matrice “Utiliser / Ne pas utiliser”**

### **15.1 Utiliser**

L’agent IA doit privilégier les solutions suivantes quand elles répondent correctement au besoin :

- Policies
- Gates
- Form Requests
- autorisation centralisée
- validation structurée
- services applicatifs ciblés
- injection de dépendances
- service container
- service providers
- middleware ciblés
- current context explicite
- navigation déclarative
- exposition backend des capacités
- feature flags centralisés
- tests HTTP
- tests de règles d’accès
- tests d’intégration de contexte
- composants réutilisables
- hooks réutilisables
- design system cohérent

### **15.2 Ne pas utiliser**

L’agent IA doit éviter ou refuser :

- hardcode de rôles
- checks de rôles textuels dispersés
- logique d’accès dans React
- sécurité réelle côté frontend
- DB calls dans views / nav / layout / breadcrumb
- récupération tardive de modèle pour URL
- fallback `slug ?? id`
- validation inline massive
- helpers métier globaux anarchiques
- middleware monstrueux
- logique métier cachée dans les contrôleurs
- services “god object”
- code non testable
- try/catch d’architecture
- système custom auth / token inutile
- structure impossible à faire évoluer proprement

---

## **16. Critères automatiques de refus**

Une implémentation doit être considérée comme **non conforme** si l’un des points suivants est observé :

- comparaison textuelle de rôle dans la logique métier ;
- sécurité réelle confiée au frontend ;
- logique d’accès dispersée dans les composants ;
- requête DB faite dans le rendu UI ;
- génération d’URL dépendante d’un chargement tardif ;
- contrôleurs utilisés comme cœur métier ;
- architecture dépendante de fallback bricolés ;
- mécanisme Laravel pertinent contourné sans raison valable ;
- duplication forte des règles backend/frontend ;
- absence de séparation claire des responsabilités ;
- absence de stratégie de tests sur les points sensibles ;
- impossibilité d’ajouter une permission ou un module sans retoucher plusieurs couches de manière sale.

---

## **17. Définition du “Done” technique**

Une feature n’est pas considérée comme terminée tant que les points suivants ne sont pas vrais :

- la responsabilité de la feature est clairement localisée ;
- les règles d’accès sont propres ;
- les entrées sont validées correctement ;
- le contexte nécessaire est résolu proprement ;
- aucune requête opportuniste n’est faite dans le rendu ;
- la navigation fonctionne sans bricolage ;
- le frontend consomme des capacités déjà résolues ;
- les cas critiques sont testés ;
- aucun hardcode métier n’a été introduit ;
- la solution est compatible avec la maintenabilité long terme.

---

## **18. Tests obligatoires**

L’agent IA doit prévoir une vraie stratégie de tests.

### **18.1 Tests minimum attendus**

#### **Accès / autorisation**
- accès autorisé,
- accès refusé,
- cas multi-organisation,
- cas multi-membership,
- cas équipe / espace,
- cas inactif / suspendu / interdit.

#### **HTTP**
- réponses attendues,
- validation correcte,
- refus correct,
- comportement cohérent selon contexte.

#### **Contexte**
- résolution correcte du contexte courant,
- switch de contexte,
- comportement navigation selon contexte,
- génération d’URL conforme.

#### **Frontend critique**
- affichage / masquage d’actions selon capacités,
- comportement des guards UI,
- cohérence navigation / permissions.

#### **Intégration**
- activation / désactivation de modules,
- cohérence backend / frontend,
- propagation du contexte,
- stabilité du comportement global.

### **18.2 Règle**

Toute feature sensible liée à :

- sécurité,
- autorisation,
- contexte,
- navigation,
- activation de module,

sans test adapté doit être considérée comme **incomplète**.

---

## **19. Livrables attendus de l’agent IA**

L’agent IA ne doit pas répondre de manière floue.

Il doit fournir un retour structuré comprenant au minimum :

1. faisabilité globale ;
2. niveau de conformité de la starter existante ;
3. écarts structurels constatés ;
4. points bloquants éventuels ;
5. architecture cible proposée ;
6. règles d’organisation recommandées ;
7. conventions techniques retenues ;
8. points Laravel natifs à utiliser ;
9. éléments à refuser explicitement ;
10. plan d’implémentation ;
11. risques ;
12. verdict final.

---

## **20. Méthode attendue de l’agent IA**

L’agent IA doit analyser la codebase existante avec la logique suivante :

### **20.1 Étape 1 — Audit**
Identifier :

- la structure actuelle,
- les conventions déjà présentes,
- les incohérences,
- les patterns déjà utilisables,
- les patterns à refuser.

### **20.2 Étape 2 — Écarts**
Comparer la base existante avec les exigences de ce document.

### **20.3 Étape 3 — Faisabilité**
Déterminer :

- ce qui est faisable tel quel,
- ce qui nécessite adaptation,
- ce qui impose refactor,
- ce qui doit être abandonné.

### **20.4 Étape 4 — Architecture cible**
Proposer une architecture cohérente, modulaire et conforme.

### **20.5 Étape 5 — Plan**
Fournir un plan d’action réaliste, priorisé et justifié.

---

## **21. Format de réponse obligatoire de l’agent IA**

L’agent IA doit impérativement répondre dans le format suivant :

---

### **A. Résumé exécutif**
- compréhension globale du besoin
- faisabilité générale
- niveau de confiance

### **B. État de la starter actuelle**
- points conformes
- points partiellement conformes
- points non conformes

### **C. Écarts majeurs**
- écarts d’architecture
- écarts de structure
- écarts de contexte
- écarts d’autorisation
- écarts frontend/backend
- écarts de maintenabilité

### **D. Points bloquants**
- blocages réels
- risques forts
- prérequis

### **E. Architecture recommandée**
- organisation globale
- conventions proposées
- responsabilités par couche
- gestion du contexte
- gestion des accès
- gestion de la navigation
- gestion des modules

### **F. Éléments Laravel à utiliser**
- liste des mécanismes natifs à retenir
- justification de leur usage

### **G. Éléments à ne pas utiliser**
- liste précise des patterns refusés
- justification

### **H. Plan d’implémentation**
- ordre recommandé
- étapes
- dépendances
- priorités

### **I. Plan de tests**
- ce qui doit être testé
- niveau de criticité
- stratégie minimale

### **J. Risques**
- dette potentielle
- risques de complexité
- risques d’évolution
- risques de couplage

### **K. Verdict final**
- faisable oui/non
- faisable sous conditions
- refactor requis
- niveau de conformité atteignable

---

## **22. Mission finale de l’agent IA**

L’agent IA reçoit la mission suivante :

> Analyser puis cadrer l’implémentation d’une base applicative modulaire nommée **LaStarter**, orientée organisations, memberships, équipes / espaces, rôles, permissions, capacités, navigation contextualisée et modules activables.
>
> L’architecture doit être propre, modulaire, testable, maintenable et extensible.
>
> Le backend doit être la source de vérité.
>
> Le frontend doit uniquement refléter les capacités calculées.
>
> Aucun hardcode métier n’est autorisé.
>
> Toute logique d’accès doit être centralisée.
>
> Toute récupération tardive de modèle dans le rendu ou la navigation doit être refusée.
>
> Toute duplication de logique d’accès entre backend et frontend doit être refusée.
>
> Toute architecture non factorisée, non testable, non claire ou non maintenable doit être considérée comme non conforme.
>
> L’agent doit analyser la starter existante, signaler les écarts, proposer une architecture cible, lister les points bloquants, préciser les conventions Laravel à exploiter, refuser les patterns non conformes et fournir un plan d’implémentation structuré.

---

## **23. Règle de priorité absolue**

Si la starter existante contient des patterns incompatibles avec ce document, alors :

- il ne faut pas les reproduire,
- il faut les signaler,
- il faut proposer une alternative conforme,
- il faut expliquer l’impact du refactor nécessaire.

La compatibilité avec l’existant ne doit jamais servir d’excuse pour accepter une mauvaise architecture.

---

## **24. Conclusion attendue**

Le projet n’est considéré comme réussi que si le résultat obtenu correspond à une vraie base produit :

- propre,
- cohérente,
- modulaire,
- durable,
- testable,
- évolutive,
- sans hardcode d’accès,
- sans sécurité frontend,
- sans logique opportuniste dans le rendu,
- sans dette structurelle immédiate.

Tout ce qui s’éloigne de cet objectif doit être signalé comme non conforme.

---

# **BLOC FINAL À ENVOYER TEL QUEL À L’AGENT IA**

Tu peux aussi lui envoyer juste ce bloc si tu veux tout résumer à la fin du document :

> **Tu dois analyser la starter existante et proposer une architecture conforme au présent document.**
>
> **Tu dois refuser tout hardcode métier, toute logique d’accès dispersée, toute sécurité réelle côté frontend, toute requête DB dans le rendu UI, toute génération d’URL dépendante d’un chargement tardif, toute architecture non factorisée et toute solution qui contourne inutilement les mécanismes Laravel adaptés.**
>
> **Tu dois produire une réponse structurée, argumentée, exploitable, avec écarts, blocages, architecture cible, conventions recommandées, plan d’implémentation, plan de tests et verdict final.**
>
> **Le backend est la source de vérité. Le frontend ne fait que refléter les capacités calculées.**
>
> **L’objectif n’est pas de “faire marcher vite”, mais de construire une base propre, modulaire, maintenable et durable.**

---

Si tu veux, juste après, je peux te faire une **version encore plus propre “ultra pro”**, avec :

- numérotation hiérarchique stricte,
- ton plus formel,
- mise en page style **document d’architecture / PDF-ready**.