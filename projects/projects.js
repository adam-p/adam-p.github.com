$(function() {
  //
  // Load project lists dynamically using Github and Bitbucket APIs.
  //

  $.getJSON('https://api.github.com/users/adam-p/repos?sort=pushed&callback=?', function(repos, textStatus, jqXHR) {
    var repoTemplate;

    if (textStatus !== 'success') {
      $('#github-repos').text('Failed to load repos');
      return;
    }

    repos = repos.data;

    repos = repos.filter(function(elem) {
      // Don't show forks of other projects or private repos.
      return !elem.fork && !elem.private;
    });

    repos.sort(function(a, b) {
      return a.pushed_at < b.pushed_at;
    });

    // Make sure to pull out the template before emptying the element.
    repoTemplate = $('#github-repo-template').html();

    // Remove the "Loading..." message
    $('#github-repos').empty();

    // Render the repos
    $.each(repos, function() {
      $('#github-repos').append(_.template(repoTemplate, this));
    });
  });

  $.getJSON('https://api.github.com/users/adam-p/gists?callback=?', function(gists, textStatus, jqXHR) {
    var gistTemplate;

    if (textStatus !== 'success') {
      $('#github-gists').text('Failed to load gists');
      return;
    }

    gists = gists.data;

    gists = gists.filter(function(elem) {
      // Don't show private gists.
      return !elem.private;
    });

    gists.sort(function(a, b) {
      return a.updated_at < b.updated_at;
    });

    // Create the Gist title the way Github does: with the first asciibetical filename.
    gists = _.map(gists, function(gist) {
      gist.GIST_NAME = _.keys(gist.files).sort()[0];
      return gist;
    });

    // Make sure to pull out the template before emptying the element.
    gistTemplate = $('#github-gist-template').html();

    // Remove the "Loading..." message
    $('#github-gists').empty();

    // Render the gists
    $.each(gists, function() {
      $('#github-gists').append(_.template(gistTemplate, this));
    });
  });

  $.getJSON('https://api.bitbucket.org/1.0/users/adamp?callback=?', function(repos, textStatus, jqXHR) {
    var repoTemplate;

    if (textStatus !== 'success') {
      $('#bitbucket-repos').text('Failed to load repos');
      return;
    }

    repos = repos.repositories;

    repos = repos.filter(function(elem) {
      // Don't show forks of other projects or private repos.
      return !elem.is_fork && !elem.is_private;
    });

    repos.sort(function(a, b) {
      return a.last_updated < b.last_updated;
    });

    // Make sure to pull out the template before emptying the element.
    repoTemplate = $('#bitbucket-repo-template').html();

    // Remove the "Loading..." message
    $('#bitbucket-repos').empty();

    // Render the repos
    $.each(repos, function() {
      $('#bitbucket-repos').append(_.template(repoTemplate, this));
    });
  });

});
