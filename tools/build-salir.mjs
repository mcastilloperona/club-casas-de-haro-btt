import fs from 'node:fs';
const dir='salir',version=fs.readFileSync(dir+'/VERSION','utf8').trim();
if(!/^\d+\.\d+(?:\.\d+)?$/.test(version))throw Error('Invalid Salir VERSION');
let html=fs.readFileSync(dir+'/index.html','utf8');
html=html.replace(/(<meta name="application-version" content=")[^"]+("\s*\/>|">)/,`$1${version}$2`).replace(/(<span class="app-version" id="appVersion" aria-label=")Versión [^"]+(">)v[^<]+(<\/span>)/,`$1Versión ${version}$2v${version}$3`);
html=html.replace(/((?:src|href)="\.\/[^"?]+\.(?:js|css))(?:\?[^"]*)?(")/g,`$1?v=${version}$2`);
fs.writeFileSync(dir+'/index.html',html);
fs.writeFileSync(dir+'/sw.js',fs.readFileSync(dir+'/sw.js','utf8').replace(/const CACHE='[^']+'/,`const CACHE='salir-shell-${version}'`));
console.log('Salir '+version+' · /salir/');

