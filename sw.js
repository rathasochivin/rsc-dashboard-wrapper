/* ⭐⭐⭐ Service Worker សម្រាប់ ប្រព័ន្ធគ្រប់គ្រងឯកសារសវនកម្មពន្ធដារ
   ២០២៦-០៨-២៨ ៖ ធ្វើឱ្យកម្មវិធី **ដំឡើងបានលើទូរស័ព្ទ និងកុំព្យូទ័រ**
   ( មានរូបតំណាង · បើកគ្មានរបារកម្មវិធីរុករក · ដំណើរការពេលអ៊ីនធឺណិតដាច់ ) ។

   ⚠⚠ គ្រោះថ្នាក់ធំបំផុតនៃ service worker ៖ **វាបម្រើកំណែចាស់** ។
     អ្នកធ្វើបច្ចុប្បន្នភាព index.html រួច upload ទៅ GitHub ⇒ តែ SW ឆ្លើយ
     ពី cache ⇒ អ្នកឃើញឯកសារចាស់ ហើយពិនិត្យ RSCBUILD ឃើញលេខចាស់ ។
     នេះនឹងធ្វើអោយការបំបាត់កំហុសក្លាយជាកន្លែងងងឹតទាំងស្រុង ។
   ⇒ ដូច្នេះ ៖
     · ទំព័រ ( navigate / HTML ) ⇒ **បណ្ដាញមុនគេ** ; cache ជាជម្រើសបម្រុង
       តែពេលអ៊ីនធឺណិតដាច់ ⇒ កំណែថ្មីមកដល់ជានិច្ចពេលមានអ៊ីនធឺណិត ។
     · រូបតំណាង/manifest ⇒ cache មុនគេ ( វាមិនប្តូរញឹកញាប់ ) ។
     · skipWaiting + clients.claim ⇒ កំណែថ្មីចាប់ការភ្លាម មិនរង់ចាំបិទផ្ទាំង ។
   ⚠ ប្តូរលេខ CACHE រាល់ពេលចេញកំណែថ្មី ⇒ cache ចាស់ត្រូវលុបចោល ។ */
var CACHE = 'rsc-audit-v1';
var SHELL = ['./manifest.json', './icon-192.png', './icon-512.png',
             './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(SHELL.map(function(u){
      return c.add(u).catch(function(){});   /* ⚠ ឯកសារខ្វះមួយ មិនត្រូវធ្វើឱ្យការដំឡើងបរាជ័យ */
    }));
  }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;

  var url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(url.origin !== self.location.origin) return;   /* ⚠ កុំប៉ះ Apps Script ឬដែនផ្សេង */

  var isPage = req.mode === 'navigate'
    || (req.headers.get('accept') || '').indexOf('text/html') >= 0
    || /\.html?$/i.test(url.pathname);

  if(isPage){
    /* បណ្ដាញមុនគេ ⇒ កំណែថ្មីមិនអាចត្រូវលាក់ដោយ cache */
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match('./index.html') || Response.error();
        });
      })
    );
    return;
  }

  /* ធនធានឋិតិវន្ត ⇒ cache មុនគេ រួចបំពេញ cache ពីបណ្ដាញ */
  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        return res;
      });
    })
  );
});
