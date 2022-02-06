$(function() {
  "use strict";

  //
  // Load project lists dynamically using Github and Bitbucket APIs.
  //

  // Github repos results are paged (and I have a couple of pages of them), so we'll build
  // up a set of them and then process them.
  var githubRepos = [];
  (function pullGithubRepos(pageNum) {
    var url = 'https://api.github.com/users/adam-p/repos?page=' + pageNum + '&callback=?';
    $.getJSON(url, function(repos, textStatus, jqXHR) {
      var repoTemplate;

      if (textStatus !== 'success') {
        $('#github-repos').text('Failed to load repos');
        return;
      }

      repos = repos.data;

      if (repos.length > 0) {
        // Nonzero result. Filter and keep paging.
        githubRepos = githubRepos.concat(repos.filter(function(elem) {
          // Don't show forks of other projects or private repos or archived repos.
          return !elem.fork && !elem.private && !elem.archived;
        }));

        pullGithubRepos(pageNum+1);
        return;
      }

      // No repos in this page, so we're done paging.

      // Sort by last push, descending
      githubRepos.sort(function(a, b) {
        return a.pushed_at === b.pushed_at ? 0 : a.pushed_at < b.pushed_at ? 1 : -1;
      });

      // Make sure to pull out the template before emptying the element.
      repoTemplate = $('#github-repo-template').html();

      // Remove the "Loading..." message
      $('#github-repos').empty();

      // Render the repos
      $.each(githubRepos, function() {
        try {
          $('#github-repos').append(_.template(repoTemplate, this));
        } catch(e) {}
      });
    });
  })(1);

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

    // Sort by recently updated
    gists.sort(function(a, b) {
      return a.updated_at === b.updated_at ? 0 : a.updated_at < b.updated_at ? 1 : -1;
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
      try {
        $('#github-gists').append(_.template(gistTemplate, this));
      } catch(e) {}
    });
  });

});
