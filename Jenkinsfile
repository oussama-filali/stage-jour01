pipeline {
  agent any
  options { timestamps() }

  stages {
    stage('Récupération du code') {
      steps { checkout scm }
    }

    stage('Installation') {
      steps {
        dir('Jour01/node-demo') {
          sh 'node --version'
          sh 'npm --version'
          sh 'npm ci'
        }
      }
    }

    stage('Tests') {
      steps {
        dir('Jour01/node-demo') {
          sh 'npm test'
        }
      }
    }
  }
}
