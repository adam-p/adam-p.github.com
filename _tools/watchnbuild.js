#!/usr/bin/env node

/*jslint node: true */
'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var less = require('less');
var watchr = require('watchr');

console.log('Watching for changes...');

var boostrap_less = [
    '../assets/styles/bootstrap/less/variables.less',
    '../assets/styles/bootstrap/less/bootstrap.less',
    '../assets/styles/bootstrap/less/responsive.less'
  ];

var primary_less = [
    ['../assets/styles/less/main.less', '../assets/styles/main.css']
  ];

var watch_files = [];
watch_files = watch_files.concat(boostrap_less);
watch_files = watch_files.concat(_.map(primary_less, function(tuple) {return tuple[0];}));

watchr.watch({
  paths: watch_files,
  listener: onChange
});


function onChange(change_type, filename) {
  // Right now we only have .less files, so no need to check the filename.
  compileLess();
}


function compileLess() {
  var i;

  // Note that we're starting from 1 -- skipping variables.less
  for (i = 1; i < boostrap_less.length; i++) {
    compileLessFile(boostrap_less[i], boostrap_less[i].replace(/less/g, 'css'));
  }

  for (i = 0; i < primary_less.length; i++) {
    compileLessFile(primary_less[i][0], primary_less[i][1]);
  }

  function compileLessFile(filename, outfilename) {
    fs.readFile(filename, {encoding: 'utf8'}, function(err, data) {
      if (err) {
        throw err;
      }

      less.render(
            data,
            {paths: [path.dirname(filename)]},
            function (err, css) {
        if (err) {
          throw err;
        }

        fs.writeFile(outfilename, css, function(err) {
          if (err) {
            throw err;
          }

          console.log('Compiled', filename);
        });
      });
    });
  }
}


// Start out with a compilation
compileLess();
