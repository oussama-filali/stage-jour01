# Stage

Dépôt de travail pour les exercices (Jenkins + petit projet Node pour valider une CI).

## Lancer Jenkins (Docker)

Prérequis : Docker Desktop installé et démarré.

1) Démarrer Jenkins

Dans le dossier du repo :

`docker compose up -d --build`

2) Ouvrir Jenkins

Aller sur : http://localhost:8080

3) Récupérer le mot de passe initial

`docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword`

## Configurer le job (pipeline)

Objectif : Jenkins clone le repo et exécute le pipeline défini dans `Jenkinsfile`.

1) Créer un nouveau job → "Pipeline"
2) Dans "Pipeline" → "Definition" : "Pipeline script from SCM"
3) SCM : Git
4) Repository URL : l’URL de ton repo GitHub
5) Branch : `main`
6) Script Path : `Jenkinsfile`
7) Sauvegarder → "Build Now"

Le pipeline lance `npm ci` puis `npm test` dans `Jour01/node-demo`.

## Déclenchement au push (simple)

Si Jenkins est en local (localhost), GitHub ne peut pas toujours l’atteindre pour un webhook.
Dans ce cas, le plus simple est d’activer un déclencheur "Poll SCM" (ex: toutes les 1 min) le temps du projet.
