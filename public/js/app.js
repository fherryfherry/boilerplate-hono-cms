(function () {
  // Prefix-aware HTMX configuration
  document.addEventListener('htmx:configRequest', function (evt) {
    var basePath = document.documentElement.getAttribute('data-base-path') || '';
    if (basePath && evt.detail.path && evt.detail.path.startsWith('/') && !evt.detail.path.startsWith(basePath + '/')) {
      evt.detail.path = basePath + evt.detail.path;
    }
  });

  // Re-initialize Lucide icons after HTMX swaps
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  document.addEventListener('DOMContentLoaded', refreshIcons);
  document.addEventListener('htmx:afterSwap', refreshIcons);
  document.addEventListener('htmx:afterSettle', refreshIcons);

  // Toast event listener (triggered via HX-Trigger: {"toast": {"title": "...", "variant": "success"}} or window.showToast)
  window.showToast = function (detail) {
    var payload = typeof detail === 'string' ? { title: detail, variant: 'default' } : (detail || {});
    window.dispatchEvent(
      new CustomEvent('shadcn-toast', {
        detail: {
          id: Date.now() + Math.random(),
          title: payload.title || 'Notification',
          description: payload.description || '',
          variant: payload.variant || 'default',
        },
      })
    );
  };

  document.body.addEventListener('toast', function (evt) {
    window.showToast(evt.detail);
  });

  document.body.addEventListener('closeModal', function () {
    window.dispatchEvent(new CustomEvent('shadcn-modal-close'));
  });
})();
