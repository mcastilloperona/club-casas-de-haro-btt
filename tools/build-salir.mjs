import fs from 'node:fs';
const dir='salir',version=fs.readFileSync(dir+'/VERSION','utf8').trim();
if(!/^\d+\.\d+(?:\.\d+)?$/.test(version))throw Error('Invalid Salir VERSION');
const worker=fs.readFileSync(dir+'/sw.js','utf8'),cachedRelease=worker.match(/const CACHE='salir-shell-([^']+)'/)?.[1];
const release=cachedRelease?.startsWith(version+'-')?cachedRelease:version;
let html=fs.readFileSync(dir+'/index.html','utf8');
html=html.replace(/(<meta name="application-version" content=")[^"]+("\s*\/>|">)/,`$1${version}$2`).replace(/(<span class="app-version" id="appVersion" aria-label=")Versión [^"]+(">)v[^<]+(<\/span>)/,`$1Versión ${version}$2v${version}$3`);
html=html.replace(/((?:src|href)="\.\/[^"?]+\.(?:js|css))(?:\?[^"]*)?(")/g,`$1?v=${release}$2`);
fs.writeFileSync(dir+'/index.html',html);
fs.writeFileSync(dir+'/sw.js',worker.replace(/const CACHE='[^']+'/,`const CACHE='salir-shell-${release}'`));
console.log('Salir '+version+' · /salir/');

