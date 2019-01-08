// requires:
// https://github.com/jenkinsci/pipeline-aws-plugin
// https://github.com/jenkinsci/docker-workflow-plugin
// https://github.com/jenkinsci/http-request-plugin
// in addition to standard pipeline plugins
@Library("jenkins-utils") _

pipeline {
  agent { label "docker" }

  environment {
    NODE_ENV = "staging"
  }

  stages {
    stage ("Checkout code") {
      steps {
        script {
          def scmVars = checkout(scm)
          env.GIT_COMMIT = scmVars.GIT_COMMIT
          env.GIT_BRANCH = scmVars.GIT_BRANCH
          env.GIT_URL = scmVars.GIT_URL
        }
      }
    }

    stage ("Install dependencies") {
      agent {
        docker {
          image "node:8.11-alpine"
          args "-v /ecs/jenkins/yarn-cache:/yarn-cache -v /ecs/jenkins/yarn-mirror:/yarn-mirror"
        }
      }
      steps {
        sh "yarn config set yarn-offline-mirror /yarn-mirror"
        sh "yarn install --frozen-lockfile --cache-folder /yarn-cache"
      }
    }

    stage ("Test") {
      agent { docker "node:8.11-alpine" }
      steps {
        sh "echo 'here is where we would run yo axios (or something?)'"
      }
    }
  }

  post {
    always {
      dir ("project-name") { deleteDir() }

      logBuildMetrics()
    }

    changed {
      notify result: currentBuild.result, number: env.BUILD_NUMBER, name: env.JOB_NAME, url: env.RUN_DISPLAY_URL
    }
  }
}