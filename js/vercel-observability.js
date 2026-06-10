/** Load Vercel Web Analytics and Speed Insights on deployed hosts only. */
(function initVercelObservability() {
  const host = window.location.hostname;
  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.local');

  if (isLocal) return;

  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  window.si = window.si || function () {
    (window.siq = window.siq || []).push(arguments);
  };

  function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }

  loadScript('/_vercel/insights/script.js');
  loadScript('/_vercel/speed-insights/script.js');
})();
