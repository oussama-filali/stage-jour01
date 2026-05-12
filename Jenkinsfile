pipeline {
  agent any
  options { timestamps() }

  stages {
    stage('Récupération du code') {
      steps { checkout scm }
    }

    stage('Install') {
      steps {
        dir('Jour01/node-demo') {
          sh 'node --version'
          sh 'npm --version'
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
