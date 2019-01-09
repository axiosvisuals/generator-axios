// requires:
// https://github.com/jenkinsci/pipeline-aws-plugin
// https://github.com/jenkinsci/docker-workflow-plugin
// https://github.com/jenkinsci/http-request-plugin
// in addition to standard pipeline plugins
@Library("jenkins-utils") _

def NODE_IMAGE = "node:10.12-alpine"

pipeline {
  agent {
    node {
      label "docker"
      customWorkspace "/scratch/${env.JOB_NAME}"
    }
  }

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
          image NODE_IMAGE
          args "-v /cache/yarn-cache:/yarn-cache -v /cache/yarn-mirror:/yarn-mirror"
          reuseNode true
        }
      }
      steps {
        sh "yarn config set yarn-offline-mirror /yarn-mirror"
        sh "yarn install --frozen-lockfile --prod=false --cache-folder /yarn-cache"
      }
    }

    stage ("Lint and Test") {
      agent {
        docker {
          image NODE_IMAGE
          reuseNode true
        }
      }
      steps {
        parallel (
          "ESLint": {
            sh "yarn eslint . --format=junit --output-file=./reports/junit-eslint.xml"
          },
          "Jest": {
            sh "NODE_ENV=test yarn jest -w 2"  // Set node_env to test so Babel will transpile ESM for us.
          }
        )
      }
    }

    stage ("Build") {
      agent {
        docker {
          image NODE_IMAGE
          reuseNode true
        }
      }
      steps {
        // Run Yeoman, then see if its generated files build
        sh """
          yarn global add yeoman-doctor
          yarn add yo
          yarn link
          mkdir test-project && cd test-project
          echo 'n' | yarn yo axios --force
          yarn webpack -p
        """
      }
    }
  }

  post {
    always {
      dir ("test-project") { deleteDir() }

      logBuildMetrics()
    }

    changed {
      notify result: currentBuild.result, number: env.BUILD_NUMBER, name: env.JOB_NAME, url: env.RUN_DISPLAY_URL
    }
  }
}
