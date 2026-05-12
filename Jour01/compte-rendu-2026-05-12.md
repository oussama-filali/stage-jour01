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

---

## 🧪 Créer mon premier pipeline (Jenkinsfile)

J’ai utilisé un pipeline simple en 4 étapes (Install/Lint/Test/Build) afin d’avoir une base CI reproductible.

Jenkinsfile (à la racine du repo) :

```groovy
pipeline {
	agent any
	stages {
		stage('Install') {
			steps {
				dir('Jour01/node-demo') {
					sh 'npm ci'
				}
			}
		}
		stage('Lint') {
			steps {
				dir('Jour01/node-demo') {
					sh 'npm run lint'
				}
			}
		}
		stage('Test') {
			steps {
				dir('Jour01/node-demo') {
					sh 'npm test'
				}
			}
		}
		stage('Build') {
			steps {
				dir('Jour01/node-demo') {
					sh 'npm run build'
				}
			}
		}
	}
	post {
		success { echo '✅ Pipeline OK : prêt à déployer' }
		failure { echo '❌ Quelque chose a planté : vérifie les logs' }
	}
}
```

---

## 🔐 Jenkins — erreurs de sécurité classiques à connaître

C’est important dans un contexte Stormsecurity : en audit CI/CD, je retrouve souvent les mêmes mauvaises configurations.

| Mauvaise pratique | Risque | Bonne pratique |
|------------------|--------|----------------|
| Credentials en clair dans le Jenkinsfile | Exposition des secrets dans le repo | Utiliser Jenkins Credentials Manager |
| Builds qui tournent sur le controller | Compromission du serveur Jenkins | Utiliser des agents/nodes dédiés |
| Jenkins exposé sur Internet sans auth | Accès total à l'infrastructure | Reverse proxy + authentification forte |
| Pas de RBAC | N'importe qui peut lancer un build | Configurer les rôles (Role Strategy Plugin) |
| Dépendances non vérifiées | Supply chain attack | npm audit + OWASP Dependency Check dans le pipeline |

Référence : https://www.jenkins.io/doc/book/security/

---

## 2. API REST sécurisée

Je sais construire des APIs : l’objectif ici est de me concentrer sur comment les sécuriser et les auditer.

Dans mon mini projet, j’utilise Node.js en natif (module `node:http`) et pas Express.

### 📖 Points de sécurité à maîtriser sur une API REST

Exemple d’appel :

```
POST /api/login
Authorization: Bearer <token>
Content-Type: application/json
```

| Point de contrôle | Problème fréquent | Solution |
|------------------|-------------------|----------|
| Authentification | JWT sans expiration, secret faible | exp dans le payload, secret fort en env |
| Autorisation (IDOR) | /api/users/42 accessible par n'importe qui | Vérifier que l'user connecté = propriétaire de la ressource |
| Validation des inputs | Pas de schéma de validation → injection | zod ou joi sur chaque endpoint |
| Rate limiting | Pas de limite → brute force, DoS | Limiter les requêtes par IP (en code, ou via un reverse proxy) |
| Headers de sécurité | Pas de headers → info leak, XSS | Ajouter des headers (CSP, X-Frame-Options, etc.) |
| CORS mal configuré | Access-Control-Allow-Origin: * | Whitelist explicite des origines |
| Logs & monitoring | Aucune trace des appels | Logger chaque requête avec IP, user, endpoint |

### ⚡ Exemple : sécuriser une API Node (sans Express) en 5 minutes

```javascript
import http from 'node:http'
import { URL } from 'node:url'

const allowedOrigins = new Set(['https://stormsecurity.fr'])

// Rate limiting très simple en mémoire (à remplacer par Redis en prod)
const counters = new Map()
function isRateLimited(ip, key, { windowMs, max }) {
	const now = Date.now()
	const counterKey = `${key}:${ip}`
	const entry = counters.get(counterKey)

	if (!entry || now > entry.resetAt) {
		counters.set(counterKey, { count: 1, resetAt: now + windowMs })
		return false
	}

	entry.count += 1
	return entry.count > max
}

function setSecurityHeaders(res) {
	res.setHeader('x-content-type-options', 'nosniff')
	res.setHeader('x-frame-options', 'DENY')
	res.setHeader('referrer-policy', 'no-referrer')
	res.setHeader('content-security-policy', "default-src 'none'")
}

const server = http.createServer(async (req, res) => {
	setSecurityHeaders(res)

	// CORS strict (si besoin)
	const origin = req.headers.origin
	if (origin && allowedOrigins.has(origin)) {
		res.setHeader('access-control-allow-origin', origin)
		res.setHeader('vary', 'origin')
	}

	const url = new URL(req.url ?? '/', 'http://localhost')
	const ip = (req.socket.remoteAddress ?? 'unknown').replace('::ffff:', '')

	if (url.pathname === '/api/login' && req.method === 'POST') {
		// Rate limiting renforcé sur le login
		if (isRateLimited(ip, 'login', { windowMs: 60_000, max: 5 })) {
			res.writeHead(429, { 'content-type': 'text/plain; charset=utf-8' })
			res.end('Trop de requêtes, réessaie plus tard.')
			return
		}

		// Ici : lire le body + valider les champs (ex: zod/joi)
		res.writeHead(200, { 'content-type': 'application/json' })
		res.end(JSON.stringify({ ok: true }))
		return
	}

	res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
	res.end('Not found')
})

server.listen(3000)
```

Ressource : https://owasp.org/www-project-api-security/
