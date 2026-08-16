(function() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'F2' || e.keyCode === 113)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.dispatchEvent(new CustomEvent('daem-shortcut-triggered'));
    }
  }, true);
})();
