export function loadScript(src){
  return new Promise((resolve, reject)=>{
    const existing = document.querySelector(`script[src="${src}"]`);
    if(existing){ resolve(true); return; }
    const script = document.createElement('script');
    script.src = src; script.async = true;
    script.onload = ()=> resolve(true);
    script.onerror = ()=> reject(new Error('Failed to load script'));
    document.body.appendChild(script);
  });
}
