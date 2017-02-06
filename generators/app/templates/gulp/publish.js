'use strict';

const gulp = require('gulp');
const gulpIf = require('gulp-if');
const awspublish = require('gulp-awspublish');
const prompt = require('gulp-prompt');
const rename = require('gulp-rename');
const gutil = require('gulp-util');
const AWS = require('aws-sdk');
const debug = require('gulp-debug');

const config = require('./config');
const projectConfig = require('./../project.config');

const debugMode = false;

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

module.exports = () => {

  var publisher = awspublish.create({
    region: 'us-east-1',
    params: {
      Bucket: projectConfig.s3.bucket,
    },
    credentials: new AWS.SharedIniFileCredentials({profile: 'axios'})
  }, {
    cacheFileName: '.aws_cache'
  });

  var hasFolder = (projectConfig.s3.folder) ? true : false;

  return gulp.src(config.dirs.dist + "/**/*.*")
    .pipe(gulpIf(hasFolder, rename(function (path) {
        path.dirname = '/'+ projectConfig.s3.folder +'/'+ path.dirname;
    })))
    .pipe(gulpIf(!hasFolder, prompt.confirm({
      message: `You haven't specified an S3 folder. Continuing to run this command will replace everything in {projectConfig.s3.bucket}. Are you sure you want to contine?`,
      default: false
    })))
    // .pipe(awspublish.gzip({ ext: '.gz' }))
    .pipe(publisher.publish({}, {simulate: false, createOnly: false}))
    .pipe(publisher.cache())
    .pipe(awspublish.reporter());
}
