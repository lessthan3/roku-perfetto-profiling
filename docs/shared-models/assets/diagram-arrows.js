// Draws the connecting arrows for the diagram figures. The cards themselves are
// ordinary divs laid out by CSS grid — this only measures where they landed and
// emits one <path> per link into an SVG overlay stretched over the figure.
//
// Arrows are declared in the markup, not here: any element carrying
// `data-from="<id>"` is a link source, and its `data-to` names the target
// card's `data-node` id. That keeps the diagram's content in the HTML and
// leaves this file responsible only for geometry.
//
// Why measure instead of using a fixed viewBox: the cards hold real text that
// reflows with the font, the viewport and the user's zoom, so the endpoints are
// only knowable after layout.

(function () {
  var SIDE_GAP = 8;    // px of clear space between a card edge and the arrowhead
  var MIN_BOW = 26;    // minimum horizontal control-point offset, so short hops still curve

  function anchor(rect, frame, side) {
    var y = rect.top - frame.top + rect.height / 2;

    if (side === 'right') return { x: rect.right - frame.left + SIDE_GAP, y: y };
    if (side === 'left') return { x: rect.left - frame.left - SIDE_GAP, y: y };
    if (side === 'bottom') return { x: rect.left - frame.left + rect.width / 2, y: rect.bottom - frame.top + SIDE_GAP };

    return { x: rect.left - frame.left + rect.width / 2, y: rect.top - frame.top - SIDE_GAP };
  }

  // horizontal cubic — the bow scales with the gap so long crossings stay readable
  // and short ones don't loop back on themselves
  function curve(a, b) {
    var bow = Math.max(Math.abs(b.x - a.x) * 0.42, MIN_BOW);

    return 'M ' + a.x + ' ' + a.y +
           ' C ' + (a.x + bow) + ' ' + a.y +
           ', ' + (b.x - bow) + ' ' + b.y +
           ', ' + b.x + ' ' + b.y;
  }

  function vertical(a, b) {
    var bow = Math.max(Math.abs(b.y - a.y) * 0.42, MIN_BOW);

    return 'M ' + a.x + ' ' + a.y +
           ' C ' + a.x + ' ' + (a.y + bow) +
           ', ' + b.x + ' ' + (b.y - bow) +
           ', ' + b.x + ' ' + b.y;
  }

  // one marker per stroke colour — markers can't inherit the path's stroke, so
  // each distinct colour needs its own <marker> to get a matching arrowhead
  function ensureMarker(defs, color) {
    var id = 'dgm-mk-' + color.replace(/[^a-z0-9]/gi, '');
    if (defs.querySelector('#' + id)) return id;

    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', id);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');

    var head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    head.setAttribute('points', '0,0 10,5 0,10');
    head.setAttribute('fill', color);
    marker.appendChild(head);
    defs.appendChild(marker);

    return id;
  }

  function draw(figure) {
    var svg = figure.querySelector('svg.dgm-arrows');
    var stage = figure.querySelector('.dgm');
    if (!svg || !stage) return;

    var frame = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + frame.width + ' ' + frame.height);
    svg.setAttribute('width', frame.width);
    svg.setAttribute('height', frame.height);

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);

    figure.querySelectorAll('[data-from]').forEach(function (source) {
      var axis = source.dataset.axis || 'x';
      var fromSide = source.dataset.fromSide || (axis === 'y' ? 'bottom' : 'right');
      var toSide = source.dataset.toSide || (axis === 'y' ? 'top' : 'left');

      // colour comes from the source's own computed colour, so the arrow tracks
      // whatever the theme and the client's CSS variable resolved to
      var color = source.dataset.color
        ? getComputedStyle(source).getPropertyValue(source.dataset.color).trim() || 'currentColor'
        : getComputedStyle(source).color;

      var owner = source.closest('[data-client]');
      var a = anchor(source.getBoundingClientRect(), frame, fromSide);

      // one source can fan out to several targets — "a,b" draws a path to each
      source.dataset.to.split(',').forEach(function (name) {
        var target = figure.querySelector('[data-node="' + name.trim() + '"]');
        if (!target) return;

        // a fan-out diagram groups by TARGET rather than by source, so the path
        // also carries the client it arrives at — lets a legend dim by either end
        var receiver = target.closest('[data-client]');

        // `data-color-by="target"` recolours per destination instead of per source,
        // which is what a fan-OUT needs: one source, one colour per arm
        var pathColor = color;
        if (source.dataset.colorBy === 'target' && receiver && receiver.dataset.color) {
          pathColor = getComputedStyle(receiver).getPropertyValue(receiver.dataset.color).trim() || color;
        }

        var b = anchor(target.getBoundingClientRect(), frame, toSide);

        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', axis === 'y' ? vertical(a, b) : curve(a, b));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', pathColor);
        path.setAttribute('stroke-width', source.dataset.width || '1.3');
        path.setAttribute('marker-end', 'url(#' + ensureMarker(defs, pathColor) + ')');
        path.setAttribute('opacity', '0.9');

        // dashed = fallback chain, dotted = no source in this feed; both are
        // legend-bearing states, so they stay declared in the markup
        if (source.dataset.dash) path.setAttribute('stroke-dasharray', source.dataset.dash);

        // carry the client through so the existing dim-toggle CSS still applies
        if (owner) path.setAttribute('data-client', owner.dataset.client);
        if (receiver) path.setAttribute('data-client-to', receiver.dataset.client);

        svg.appendChild(path);
      });
    });
  }

  var MAX_BLEED = 220;   // past this the diagram outgrows its own column layout
  var EDGE_GUTTER = 24;  // breathing room kept between the figure and the window

  // How far the figures may spill outside the text column. Measured off the
  // wrap's real box — 100vw includes the scrollbar, which pushes the figure off
  // the left edge on any window narrow enough to show one.
  //
  // The two sides are measured separately: the "On this page" rail occupies the
  // left, so only the space between it and the wrap is free there, while the
  // right runs clear to the window edge. Bleeding symmetrically would grow the
  // figure underneath the rail.
  function setBleed() {
    var wrap = document.querySelector('.wrap');
    if (!wrap) return;

    var rect = wrap.getBoundingClientRect();
    var viewport = document.documentElement.clientWidth;

    var rail = document.querySelector('nav.sectionnav');
    var railVisible = rail && rail.offsetParent !== null;
    var leftLimit = railVisible ? rect.left - rail.getBoundingClientRect().right : rect.left;

    var room = Math.min(leftLimit, viewport - rect.right);
    var bleed = Math.max(0, Math.min(room - EDGE_GUTTER, MAX_BLEED));

    document.documentElement.style.setProperty('--fig-bleed', bleed + 'px');
  }

  function drawAll() {
    setBleed();
    document.querySelectorAll('figure.dgm-figure').forEach(draw);
  }

  // fonts land after first paint and shift every card, so redraw once they're in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);

  window.addEventListener('resize', drawAll);
  window.addEventListener('load', drawAll);

  // the cards resize with their text; ResizeObserver catches reflow that a
  // resize event alone misses (sidebar collapse, zoom, container queries)
  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(drawAll);
    document.querySelectorAll('figure.dgm-figure .dgm').forEach(function (stage) {
      observer.observe(stage);
    });
  }

  drawAll();

  // the client toggle changes opacity, not layout, but a theme flip changes the
  // resolved colours — repaint so the strokes follow
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', drawAll);

  window.redrawDiagramArrows = drawAll;
})();
