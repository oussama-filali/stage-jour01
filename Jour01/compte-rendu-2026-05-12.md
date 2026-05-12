# Compte rendu — Journée du 12 mai 2026

## Contexte
Suite à une mise à jour, Docker Desktop ne démarrait plus correctement. L’objectif de la journée était de remettre Docker en état pour pouvoir avancer sur Jenkins.

## Problème principal — Docker ne démarrait pas
### Ce qui se passait
- Docker Desktop restait bloqué sur “Starting”.
- Les commandes Docker échouaient (ex: `docker info`, `docker ps`) et/ou retournaient une erreur côté API (ex: 500).

### Ce que ça bloquait
- Impossible de lancer Jenkins en conteneur.
- Impossible d’exécuter un pipeline CI basé sur Docker.

### Hypothèse / cause probable
Le problème était lié au backend Linux de Docker.
- Docker Desktop a besoin d’un environnement Linux en arrière-plan pour exécuter les conteneurs.
- Côté WSL, j’avais une distribution openSUSE en version 1, et WSL n’était pas dans un état “propre” après la mise à jour.
- Même après plusieurs désinstallations/réinstallations, Docker restait bloqué, ce qui indique un blocage persistant (état corrompu / provisioning qui échoue) plutôt qu’un simple réglage.

## Observation — WSL / versions
### Ce qui était visible
Exemple vu pendant les vérifications :
- openSUSE-Leap-15.6 : WSL version 1
- Ubuntu : WSL version 2

### Pourquoi c’était important
WSL1 ne fournit pas le même environnement que WSL2 (WSL2 utilise un noyau Linux). Docker Desktop fonctionne mieux/attend généralement WSL2 quand j’utilise ce backend.

## Question rencontrée — Quelle version de Docker télécharger ?
### Ce qui se passait
Sur le site de Docker, il y avait plusieurs builds (ex: AMD64 vs ARM).

### Comment j’ai vérifié
- Vérification du type de processeur.

### Résultat
- Processeur x64 (Intel/AMD) → version AMD64.

## Actions faites pour corriger
- Désinstallation complète de Docker Desktop (plusieurs tentatives, car le problème persistait).
- Arrêt/cleanup des processus Docker restants (via gestionnaire des tâches / commandes).
- Nettoyage des restes après désinstallation (dossiers/config/logs Docker Desktop).
- Nettoyage des éléments WSL liés à Docker (quand présents).
- Redémarrages Windows.
- Réinstallation de Docker Desktop (AMD64).
- Installation/configuration en évitant WSL2 et en utilisant Hyper-V.

### Pourquoi Hyper-V
Sur Windows 10 Professionnel, Hyper-V est disponible. Utiliser Hyper-V permet de faire tourner l’environnement Linux de Docker sans passer par WSL, ce qui évite le point de blocage rencontré.

## Vérification (test simple)
- Lancement d’un conteneur de test : `docker run hello-world`
- Résultat attendu : message “Hello from Docker!”

## Travail fait pendant que Docker était cassé
Plutôt que d’attendre, j’ai préparé le projet pour que Jenkins puisse valider un build dès que Docker refonctionne.

### Jenkins via Docker
- `docker-compose.yml` : lancer Jenkins en conteneur.
- `jenkins/Dockerfile` : image Jenkins + Node.js (pour pouvoir lancer `npm test`).

### Pipeline
- `Jenkinsfile` : pipeline qui installe les dépendances et lance les tests.

### Mini projet Node (à builder/tester)
- `Jour01/node-demo/src/index.js` : petit serveur.
- `Jour01/node-demo/test/health.test.js` : test simple.
- `Jour01/node-demo/package.json` + `package-lock.json` : scripts et dépendances.

### Fichiers “propreté”
- `.gitignore`
- `.dockerignore`

## Résumé
Après une mise à jour, Docker Desktop est resté bloqué sur le démarrage, avec des erreurs côté API. Après plusieurs tentatives (désinstallation/réinstallation/clean), la solution retenue a été de réinstaller proprement et de basculer sur Hyper-V au lieu de WSL. Pendant le blocage, j’ai préparé Jenkins + un mini projet Node afin de pouvoir valider le fonctionnement du pipeline dès que Docker est opérationnel.
