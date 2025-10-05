// frontend/src/utils/loadScript.js
export function loadScript(src, {
  id,
  attrs = {},        // extra attributes: { 'data-foo': 'bar' }
  nonce,             // CSP nonce if your app uses one
  timeout = 15000,   // 15s safety timeout
  async = true,
  defer = true
} = {}) {
  return new Promise((resolve, reject) => {
    // Already present?
    const existing = document.querySelector(`script[src="${src}"]`) || (id && document.getElementById(id));
    if (existing) {
      // If already loaded, resolve immediately; if still loading, hook into it
      if (existing.dataset.loaded === 'true') return resolve(true);
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    if (id) script.id = id;
    script.async = async;
    script.defer = defer;
    if (nonce) script.nonce = nonce;

    // Extra attributes
    Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));

    let timer = setTimeout(() => {
      script.remove();
      reject(new Error(`Script load timed out: ${src}`));
    }, timeout);

    script.onload = () => {
      clearTimeout(timer);
      script.dataset.loaded = 'true';
      resolve(true);
    };

    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.body.appendChild(script);
  });
}
