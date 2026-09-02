/* ⭐⭐⭐ Service Worker សម្រាប់ ប្រព័ន្ធគ្រប់គ្រងឯកសារសវនកម្មពន្ធដារ
   ២០២៦-០៨-២៨ ៖ ធ្វើឱ្យកម្មវិធី **ដំឡើងបានលើទូរស័ព្ទ និងកុំព្យូទ័រ**
   ( មានរូបតំណាង · បើកគ្មានរបារកម្មវិធីរុករក · ដំណើរការពេលអ៊ីនធឺណិតដាច់ ) ។

   ⚠⚠ គ្រោះថ្នាក់ធំបំផុតនៃ service worker ៖ **វាបម្រើកំណែចាស់** ។
     អ្នកធ្វើបច្ចុប្បន្នភាព index.html រួច upload ទៅ GitHub ⇒ តែ SW ឆ្លើយ
     ពី cache ⇒ អ្នកឃើញឯកសារចាស់ ។
   ⇒ ដូច្នេះ ៖
     · ទំព័រ ( navigate / HTML ) ⇒ **បណ្ដាញមុនគេ** ; cache ជាជម្រើសបម្រុង
       តែពេលអ៊ីនធឺណិតដាច់ ⇒ កំណែថ្មីមកដល់ជានិច្ចពេលមានអ៊ីនធឺណិត ។
     · រូបតំណាង/manifest ⇒ cache មុនគេ ( វាមិនប្តូរញឹកញាប់ ) ។
     · skipWaiting + clients.claim ⇒ កំណែថ្មីចាប់ការភ្លាម ។

   ═══ កំណែ v4 ( ២០២៦-០៩-០១ ) — កែបញ្ហាបី ═══════════════════════════════
   ១ ⚠⚠ ធំបំផុត ៖ `law.json` ធ្លាប់ជា **cache មុនគេ អចិន្ត្រៃយ៍** ។ អ្នក
     ធ្វើបច្ចុប្បន្នភាពមូលដ្ឋានទិន្នន័យច្បាប់ តែអ្នកប្រើដែលធ្លាប់ចុច 📖
     រួច **នឹងមិនឃើញកំណែថ្មីជារៀងរហូត** ( រហូតដល់ប្តូរលេខ CACHE ) ។
     ⇒ ឥឡូវវាប្រើ «ឆ្លើយពី cache ភ្លាម រួចទាញកំណែថ្មីនៅខាងក្រោយ»
       ( stale-while-revalidate ) ៖ លឿនដដែល ហើយកំណែថ្មីមកដល់នៅការចុច
       លើកបន្ទាប់ ដោយមិនបាច់ចាំអ្នកប្តូរលេខកំណែ ។
     ⚠ បណ្ណាល័យ ( xlsx · pdfjs ) នៅ cache មុនគេដដែល — ពួកវាមិនប្តូរ
       ហើយវាធំ ⇒ មិនចាំបាច់ទាញឡើងវិញរាល់ពេល ។
   ២ ⚠ ការដាក់ចូល cache ធ្វើ **ដោយមិនពិនិត្យ res.ok** ⇒ 404 ឬ 500 ពេល
     GitHub Pages កំពុងដាក់ឯកសារឡើង អាចចូល cache ហើយក្លាយជាចម្លើយ
     «offline» ជារៀងរហូត ។ ឥឡូវដាក់ចូលតែពេល res.ok ។
   ៣ ⚠ ការប្រៀបធៀប LAZY ប្រើ `url.indexOf(name)` លើ **URL ពេញ** និងធ្វើ
     មុនការត្រួតពិនិត្យដែន ⇒ URL ដែនក្រៅដែលមានពាក្យនោះនឹងត្រូវចាប់ដែរ ។
     ឥឡូវប្រៀបធៀបលើ **pathname របស់ដែនយើងតែប៉ុណ្ណោះ** ។
   ⚠ ប្តូរលេខ CACHE រាល់ពេលចេញកំណែថ្មី ⇒ cache ចាស់ត្រូវលុបចោល ។
   ═══════════════════════════════════════════════════════════════════════ */
var CACHE = 'rsc-audit-v4';
var SHELL = ['./manifest.json', './icon-192.png', './icon-512.png',
             './icon-maskable-512.png', './apple-touch-icon.png'];

/* មិនប្តូរ ( បណ្ណាល័យ ) ⇒ cache មុនគេ ហើយឈប់ទាញ */
var STATIC_LAZY = ['xlsx.b64.txt', 'pdfjs.lib.js', 'pdfjs.worker.js'];
/* ប្តូរបាន ( ទិន្នន័យ ) ⇒ ឆ្លើយពី cache រួចធ្វើបច្ចុប្បន្នភាពនៅខាងក្រោយ */
var FRESH_LAZY  = ['law.json'];

function endsWithName(pathname, name){
  return pathname === '/' + name || pathname.slice(-(name.length + 1)) === '/' + name;
}

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

/* ដាក់ចូល cache តែចម្លើយល្អ ⇒ 404/500 មិនអាចជាប់ក្នុង cache */
function putIfOk(req, res){
  if(!res || !res.ok) return res;
  var copy = res.clone();
  caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
  return res;
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;

  var url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(url.origin !== self.location.origin) return;   /* ⚠ កុំប៉ះ Apps Script ឬដែនផ្សេង */

  var path = url.pathname;

  /* ១ បណ្ណាល័យធំដែលមិនប្តូរ ⇒ cache មុនគេ */
  if(STATIC_LAZY.some(function(n){ return endsWithName(path, n); })){
    e.respondWith(
      caches.match(req).then(function(hit){
        return hit || fetch(req).then(function(res){ return putIfOk(req, res); });
      })
    );
    return;
  }

  /* ២ ទិន្នន័យដែលប្តូរបាន ( law.json ) ⇒ ឆ្លើយពី cache ភ្លាម
     រួចទាញកំណែថ្មីនៅខាងក្រោយសម្រាប់ការប្រើលើកក្រោយ */
  if(FRESH_LAZY.some(function(n){ return endsWithName(path, n); })){
    e.respondWith(
      caches.match(req).then(function(hit){
        var net = fetch(req).then(function(res){ return putIfOk(req, res); })
                            .catch(function(){ return hit; });
        return hit || net;      /* មានក្នុង cache ⇒ ភ្លាម ; គ្មាន ⇒ រង់ចាំបណ្តាញ */
      })
    );
    return;
  }

  var isPage = req.mode === 'navigate'
    || (req.headers.get('accept') || '').indexOf('text/html') >= 0
    || /\.html?$/i.test(path);

  if(isPage){
    /* បណ្ដាញមុនគេ ⇒ កំណែថ្មីមិនអាចត្រូវលាក់ដោយ cache */
    e.respondWith(
      fetch(req).then(function(res){ return putIfOk(req, res); })
      .catch(function(){
        return caches.match(req).then(function(hit){
          return hit || caches.match('./index.html').then(function(h2){
            return h2 || Response.error();
          });
        });
      })
    );
    return;
  }

  /* ៣ ធនធានឋិតិវន្តផ្សេងៗ ⇒ cache មុនគេ រួចបំពេញ cache ពីបណ្ដាញ */
  e.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){ return putIfOk(req, res); });
    })
  );
});
