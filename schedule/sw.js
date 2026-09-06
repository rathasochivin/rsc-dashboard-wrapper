/* កាលវិភាគសវនកម្ម · service worker */
var CACHE = 'rsc-sched-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL).catch(function(){}) }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.map(function(n){ return n===CACHE?null:caches.delete(n) }));
  }).then(function(){ return self.clients.claim() }));
});
self.addEventListener('fetch', function(e){
  var u = e.request.url;
  if(e.request.method!=='GET' || u.indexOf('script.google.com')>=0) return;   /* កុំ cache API */
  e.respondWith(
    fetch(e.request).then(function(r){
      var copy = r.clone();
      caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy) }catch(err){} });
      return r;
    }).catch(function(){ return caches.match(e.request).then(function(m){ return m || caches.match('./index.html') }) })
  );
});
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(function(list){
    for(var i=0;i<list.length;i++) if('focus' in list[i]) return list[i].focus();
    if(clients.openWindow) return clients.openWindow('./');
  }));
});
