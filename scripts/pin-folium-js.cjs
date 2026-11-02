#!/usr/bin/env node
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path='index.html';
const pins=new Map([
['https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet.js','sha384-okbbMvvx/qfQkmiQKfd5VifbKZ/W8p1qIsWvE1ROPUfHWsDcC8/BnHohF7vPg2T6'],
['https://code.jquery.com/jquery-3.7.1.min.js','sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxAvs/HgeFs'],
['https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js','sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3'],
['https://cdnjs.cloudflare.com/ajax/libs/Leaflet.awesome-markers/2.0.2/leaflet.awesome-markers.js','sha384-p96PkhiqMxDcor51hgckjZOJvsNNKl4Uy25L8da4p+suI14Ftn3sOuFs+IPN4vFm'],
['https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.1.0/leaflet.markercluster.js','sha384-d3fZjp9NKg6g+z82JfePUaUc/O3DiJNfYUQh1lQ/+pV1TocwxX0ZU/+jVHjJ9dSU']
]);
const html=fs.readFileSync(path,'utf8');
const observed=new Set();
let count=0;
const out=html.replace(/<script\b[^>]*\bsrc=["'](https:\/\/[^"']+)["'][^>]*>/gi,(tag,url)=>{
 const integrity=pins.get(url);
 if(!integrity)throw Error('Unknown third-party script: '+url);
 if(observed.has(url)) throw Error('Unexpected duplicate external script '+url);
 observed.add(url);
 count++;
 if(tag.includes('integrity=')){
  if(!tag.includes(integrity))throw Error('Unexpected hash for '+url);
  return tag;
 }
 return tag.replace(/>\s*$/, ' integrity="' + integrity + '" crossorigin="anonymous">');
});
assert.equal(count,5,'expected exactly five external vendor scripts');
assert.equal(observed.size,pins.size,'script inventory changed');
for(const [url,hash] of pins){
 assert.ok(out.includes('integrity="'+hash+'"'),'SRI missing '+url);
}
if(out!==html) fs.writeFileSync(path,out,'utf8');
console.log(JSON.stringify({pinCount:count,inputBytes:Buffer.byteLength(html),outputBytes:Buffer.byteLength(out)}));
