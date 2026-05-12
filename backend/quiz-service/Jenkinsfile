pipeline {
    agent any

    tools {
        maven 'maven3'
    }

    environment {
        DOCKER_HUB_USER = 'fatmasboui'
        SERVICE_NAME = 'quiz-service'
        SONAR_TOKEN = credentials('sonar-cloud-token')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Unit Tests') {
            steps {
                sh 'mvn clean verify'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                sh "mvn sonar:sonar -Dsonar.projectKey=fatmasboui_Esprit-PiDev-4SAE5-2026-WallStreetEnglish-Quiz-MS -Dsonar.organization=fatmasboui -Dsonar.host.url=https://sonarcloud.io -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml -Dsonar.token=\${SONAR_TOKEN}"
            }
        }

        stage('Docker Build & Push (via Jib)') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_HUB_PASSWORD', usernameVariable: 'DOCKER_HUB_USERNAME')]) {
                        sh "mvn compile com.google.cloud.tools:jib-maven-plugin:3.4.0:build -Dimage=${DOCKER_HUB_USER}/${SERVICE_NAME}:latest -Djib.to.auth.username=\$DOCKER_HUB_USERNAME -Djib.to.auth.password=\$DOCKER_HUB_PASSWORD -Djib.from.image=eclipse-temurin:17-jdk-alpine"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "CI/CD Pipeline finished successfully!"
        }
        failure {
            echo "Pipeline failed. Check the logs."
        }
    }
}
