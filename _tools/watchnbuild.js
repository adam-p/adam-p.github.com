#!/usr/bin/env node

/*jslint node: true */
'use strict';

var fs = require('fs');
var path = require('path');
var less = require('less');
var watchr = require('watchr');

console.log('Watching for changes...');

var boostrap_less = [
    '../assets/styles/bootstrap/less/variables.less',
    '../assets/styles/bootstrap/less/bootstrap.less',
    '../assets/styles/bootstrap/less/responsive.less'
  ];

watchr.watch({
  paths: [].concat(boostrap_less),
  listener: onChange
});

function onChange(change_type, filename) {
  if (boostrap_less.indexOf(filename) >= 0) {
    compileLess();
  }
}

function compileLess() {
  // Note that we're starting from 1 -- skipping variables.less
  for (var i = 1; i < boostrap_less.length; i++) {
    compileLessFile(boostrap_less[i]);
  }

  function compileLessFile(filename) {
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

        fs.writeFile(filename.replace(/less/g, 'css'), css, function(err) {
          if (err) {
            throw err;
          }

          console.log('Compiled', filename);
        });
      });
    });
  }
}
