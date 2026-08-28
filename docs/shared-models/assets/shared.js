// Shared across all three shared-models pages: marks the current page's link
// in the top page-nav, and runs the sidebar section-nav scroll-spy. Generic —
// reads whatever links/sections exist in the DOM rather than hardcoding titles,
// so each page just needs the markup (`nav.pagenav a`, `nav.sectionnav a` +
// matching `<h2 id="...">`s) and this file does the rest.

(function () {
  // mark the pagenav link matching the current document's filename as active.
  // Compare filenames, not raw hrefs — index.html sits a level above the pages
  // it links to, so the hrefs carry "assets/" and "../" prefixes that would
  // never match a bare filename.
  var current = location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('nav.pagenav a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('/').pop();
    if (href === current) a.classList.add('is-active');
  });
})();

(function () {
  // highlight the current section link in the sidebar as the reader scrolls,
  // the same IntersectionObserver pattern used for the sticky legend bar on
  // the shared-models page
  var links = Array.prototype.slice.call(document.querySelectorAll('nav.sectionnav a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  var linkByHash = {};
  links.forEach(function (a) { linkByHash[a.getAttribute('href')] = a; });

  function setActive(link) {
    links.forEach(function (a) { a.classList.remove('is-active'); });
    link.classList.add('is-active');
  }

  // instant feedback on click — don't wait on the observer, which can miss a
  // programmatic jump if the target lands right at the rootMargin boundary
  links.forEach(function (a) {
    a.addEventListener('click', function () { setActive(a); });
  });

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = linkByHash['#' + entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) setActive(link);
    });
  }, { rootMargin: '-77px 0px -70% 0px', threshold: 0 });

  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var target = document.getElementById(id);
    if (target) sectionObserver.observe(target);
  });
})();
