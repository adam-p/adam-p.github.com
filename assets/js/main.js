
(function(global) {
  'use strict';

  $(function() {
    $.fn.socialSharePrivacy.settings.order = ['twitter', 'gplus', 'hackernews', 'facebook', 'linkedin', 'stumbleupon'];
    $.fn.socialSharePrivacy.settings.path_prefix = '/assets/js/socialshareprivacy/';

    $('.share-panel').socialSharePrivacy();

    /*
    // Set the navbar active element to the current page
    var pagefile = location.pathname.split('/').pop() || 'index.html';
    $('.nav').find('a[href="'+pagefile+'"]').parent().addClass('active');
    */
  });
})(window);
