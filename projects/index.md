---
layout: page
title: Projects
name: projects
---

<script>
$(function() {
  //
  // Load project lists dynamically using Github and Bitbucket APIs.
  //

  $.getJSON('https://api.github.com/users/adam-p/repos', function(repos, textStatus, jqXHR) {
    var i, repoTemplate, repo;
    
    if (textStatus !== 'success') {
      $('#github-repos').text('Failed to load repos');
      return;
    }

    repos = repos.filter(function(elem) {
      // Don't show forks of other projects or private repos.
      return !elem.fork && !elem.private;
    });

    repos.sort(function(a, b) {
      return a.pushed_at < b.pushed_at;
    });

    repoTemplate = $('#github-repos').find('#repo-template');
    $('#github-repos').empty();
    for (i = 0; i < repos.length; i++) {
      repo = repoTemplate.clone().attr('id', null).css('display', '');
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

  // We need to use JSONP for the Bitbucket request, as it doesn't provide a CORS
  // header in the response.
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

    repoTemplate = $('#bitbucket-repos').find('#repo-template');
    $('#bitbucket-repos').empty();
    for (i = 0; i < repos.length; i++) {
      repo = repoTemplate.clone().attr('id', null).css('display', '');
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
</script>

# {{ page.title }}

## Personal projects

### Github projects

<div id="github-repos">
  Loading...

  <div style="display: none;" id="repo-template" class="repo">
    <h4><a class="repo-link"><span class="repo-name"></span></a></h4>
    <div class="repo-desc"></div>
    <div>
      <span class="repo-watchers-info">
        <span class="repo-watchers"></span>, <span class="repo-forks"></span>.
      </span>
      <span class="repo-language"></span>
    </div>
  </div>
</div>


### Bitbucket projects

I mostly use Github for personal stuff now, but I still have a couple Bitbucket repos.

<div id="bitbucket-repos">
  Loading...

  <div style="display: none;" id="repo-template" class="repo">
    <h4><a class="repo-link"><span class="repo-name"></span></a></h4>
    <div class="repo-desc"></div>
    <div>
      <span class="repo-watchers-info"><span class="repo-watchers"></span>.</span>
      Written mostly in <span class="repo-language"></span>.
    </div>
  </div>
</div>
