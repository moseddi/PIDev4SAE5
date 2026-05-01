pipeline {
    agent any
    tools {
        nodejs 'NodeJS-20'
    }
    environment {
        SONAR_TOKEN       = credentials('jenkins-sonarrr')
        DOCKER_IMAGE_NAME = 'wall-street-english'
        DOCKER_IMAGE_TAG  = "${BUILD_NUMBER}"
        // CONTAINER_NAME et CONTAINER_PORT ne sont plus utilisés (déploiement annulé)
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install Dependencies') {
            steps { 
                bat 'npm ci --legacy-peer-deps' 
            }
        }
        stage('Build Angular') {
            steps { 
                bat 'npm run build' 
            }
        }
        stage('Unit Tests') {
            steps {
                bat 'npx ng test --watch=false --browsers=ChromeHeadless --code-coverage'
            }
        }
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sq1') {
                    bat """
                        npx sonar-scanner ^
                          -Dsonar.projectKey=wall-street-english ^
                          -Dsonar.sources=src ^
                          -Dsonar.javascript.lcov.reportPaths=coverage/wall-street-english/lcov.info ^
                          -Dsonar.token=%SONAR_TOKEN%
                    """
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                bat """
                    docker build -t %DOCKER_IMAGE_NAME%:%DOCKER_IMAGE_TAG% .
                    docker tag %DOCKER_IMAGE_NAME%:%DOCKER_IMAGE_TAG% %DOCKER_IMAGE_NAME%:latest
                """
            }
        }
        // stage('Deploy Container') supprimé
    }
    post {
        success { echo "✅ Build et analyse SonarQube réussis. (Déploiement annulé)" }
        failure { echo '❌ Pipeline échoué.' }
        always  { bat 'docker image prune -f || ver > nul' }   // 'ver > nul' simule un true sous Windows
    }
}