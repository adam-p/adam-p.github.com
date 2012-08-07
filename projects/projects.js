$(function() {
  //
  // Load project lists dynamically using Github and Bitbucket APIs.
  //

  $.getJSON('https://api.github.com/users/adam-p/repos?callback=?', function(repos, textStatus, jqXHR) {
    var i, repoTemplate, repo;
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
    repoTemplate = $('#github-repos').find('.repo-template');
    $('#github-repos').empty();

    for (i = 0; i < repos.length; i++) {
      repo = repoTemplate.clone().removeClass('repo-template').css('display', '');

      repo.find('.repo-name').text(repos[i].name);
      repo.find('.repo-link').attr('href', repos[i].html_url);
      repo.find('.repo-desc').text(repos[i].description);
      repo.find('.repo-watchers').text(repos[i].watchers_count + ' star' + (repos[i].watchers_count !== 1 ? 's' : ''));
      repo.find('.repo-forks').text(repos[i].forks_count + ' fork' + (repos[i].forks_count !== 1 ? 's' : ''));
      // Don't show watchers info if there are no watchers.
      if (repos[i].watchers_count === 1 && repos[i].forks_count === 1) {
        repo.find('.repo-watchers-info').hide();
      }
      if (repos[i].language) {
        repo.find('.repo-language').text('Written mostly in ' + repos[i].language + '.');
      }
      $('#github-repos').append(repo);
    }
  });

  $.getJSON('https://api.bitbucket.org/1.0/users/adamp?callback=?', function(repos, textStatus, jqXHR) {
    var i, repoTemplate, repo;

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
    repoTemplate = $('#bitbucket-repos').find('.repo-template');
    $('#bitbucket-repos').empty();

    for (i = 0; i < repos.length; i++) {
      repo = repoTemplate.clone().removeClass('repo-template').css('display', '');

      repo.find('.repo-name').text(repos[i].name);
      repo.find('.repo-link').attr('href', 'https://bitbucket.org/'+repos[i].owner+'/'+repos[i].slug);
      repo.find('.repo-desc').text(repos[i].description);
      repo.find('.repo-watchers').text(repos[i].followers_count + ' follower' + (repos[i].followers_count !== 1 ? 's' : ''));
      // Don't show watchers info if there are no watchers.
      if (repos[i].followers_count === 1) {
        repo.find('.repo-watchers-info').hide();
      }
      repo.find('.repo-language').text(repos[i].language || '<indeterminate>');
      $('#bitbucket-repos').append(repo);
    }
  });

});
