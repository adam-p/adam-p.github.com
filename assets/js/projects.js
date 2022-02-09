(function() {
  "use strict";

  //
  // Load project lists dynamically using GitHub APIs.
  //

  // Github repos results are paged (and I have a couple of pages of them), so we'll build
  // up a set of them and then process them.
  let githubRepos = [];
  (function pullGithubRepos(pageNum) {
    fetch('https://api.github.com/users/adam-p/repos?per_page=100&page=' + pageNum)
      .then(response => {
        if (!response.ok) {
          throw new Error('GitHub repos API request was not OK');
        }
        return response.json();
      })
      .then(repos => {
        if (repos.length > 0) {
          // Nonzero result. Filter and keep paging.
          githubRepos = githubRepos.concat(repos.filter(function(elem) {
            // Don't show forks of other projects or private repos or archived repos.
            return !elem.fork && !elem.private && !elem.archived;
          }));

          pullGithubRepos(pageNum+1);
          return;
        }

        // No repos in this page, so we're done paging. Time to process the gathered repos.

        // Sort by last push, descending
        githubRepos.sort(function(a, b) {
          return a.pushed_at === b.pushed_at ? 0 : a.pushed_at < b.pushed_at ? 1 : -1;
        });

        // Remove the "Loading..." message
        document.querySelector('#github-repos-placeholder').remove();

        // Render the repos
        const reposElem = document.querySelector('#github-repos');
        const template = document.querySelector('#github-repo-template');
        githubRepos.forEach(function(repo) {
          const templateClone = template.content.cloneNode(true);
          const repoLink = templateClone.querySelector('.repo__link');
          repoLink.href = repo.html_url;
          repoLink.textContent = repo.name;
          templateClone.querySelector('.repo__description').textContent = repo.description;

          templateClone.querySelector('.repo__stars').textContent = repo.watchers_count;
          templateClone.querySelector('.repo__forks').textContent = repo.forks_count;
          if (repo.watchers_count > 10 || repo.forks_count > 5) {
            templateClone.querySelector('.repo__stars-and-forks').classList.add('repo__popular');
          }

          if (!repo.language) {
            templateClone.querySelector('.repo__language').remove();
          } else {
            templateClone.querySelector('.repo__language__name').textContent = repo.language;
          }

          templateClone.querySelector('.repo__last-pushed').textContent = new Date(repo.pushed_at).toLocaleDateString();

          reposElem.appendChild(templateClone);
        });
      });
  })(1);

  fetch('https://api.github.com/users/adam-p/gists?per_page=100')
    .then(response => {
      if (!response.ok) {
        throw new Error('GitHub gists API request was not OK');
      }
      return response.json();
    })
    .then(gists => {
      // Sort by stars and then recently updated (because most have zero stars)
      gists.sort(function(a, b) {
        return a.updated_at === b.updated_at ? 0 : a.updated_at < b.updated_at ? 1 : -1;
      });

      // Remove the "Loading..." message
      document.querySelector('#github-gists-placeholder').remove();

      // Render the gists
      const gistsElem = document.querySelector('#github-gists');
      const template = document.querySelector('#github-gist-template');
      gists.forEach(function(gist) {
        if (!gist.public) {
          // Not that private repos should end up here anyway
          return;
        }

        const templateClone = template.content.cloneNode(true);

        // Create the Gist title the way Github does: with the first asciibetical filename.
        const gistName = Object.keys(gist.files).sort()[0];

        const gistLink = templateClone.querySelector('.gist__link');
        gistLink.href = gist.html_url;
        gistLink.textContent = gistName;

        templateClone.querySelector('.gist__description').textContent = gist.description;

        templateClone.querySelector('.gist__last-updated').textContent = new Date(gist.updated_at).toLocaleDateString();

        gistsElem.appendChild(templateClone);

      });
    });
}());
