const CACHE_NAME="msc-tracker-v2";

const CORE_ASSETS=[
    "./",
    "./index.html",
    "./style.css",
    "./theme-init.js",
    "./app.js",
    "./manifest.json",
    "./icons/favicon-16.png",
    "./icons/favicon-32.png",
    "./icons/apple-touch-icon.png",
    "./icons/icon-48.png",
    "./icons/icon-72.png",
    "./icons/icon-96.png",
    "./icons/icon-128.png",
    "./icons/icon-144.png",
    "./icons/icon-152.png",
    "./icons/icon-180.png",
    "./icons/icon-192.png",
    "./icons/icon-384.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png"
];

/* Install: cache every file so the app opens with no internet.
   Each file is added on its own, so one failure never blocks the rest. */
self.addEventListener("install",event=>{

    event.waitUntil(

        caches.open(CACHE_NAME).then(cache=>
            Promise.all(
                CORE_ASSETS.map(url=>
                    cache.add(url).catch(()=>{})
                )
            )
        )

    );

    self.skipWaiting();

});

/* Activate: delete only old app caches.
   User data lives in localStorage and is never touched here. */
self.addEventListener("activate",event=>{

    event.waitUntil(

        caches.keys().then(keys=>
            Promise.all(
                keys
                .filter(key=>key!==CACHE_NAME)
                .map(key=>caches.delete(key))
            )
        )

    );

    self.clients.claim();

});

/* Network first (fresh when online, 3 second limit),
   then cache when offline or slow. */
function networkFirst(request,fallbackUrl){

    return new Promise(resolve=>{

        let settled=false;

        const fromCache=()=>
            caches.match(request,{ignoreSearch:true})
            .then(hit=>
                hit||
                (fallbackUrl?caches.match(fallbackUrl):null)
            );

        const timer=setTimeout(()=>{

            fromCache().then(hit=>{
                if(hit&&!settled){
                    settled=true;
                    resolve(hit);
                }
            });

        },3000);

        fetch(request)
        .then(response=>{

            clearTimeout(timer);

            if(response&&response.status===200){

                const clone=response.clone();

                caches.open(CACHE_NAME)
                .then(cache=>cache.put(request,clone));

            }

            if(!settled){
                settled=true;
                resolve(response);
            }

        })
        .catch(()=>{

            clearTimeout(timer);

            fromCache().then(hit=>{
                if(!settled){
                    settled=true;
                    resolve(hit||Response.error());
                }
            });

        });

    });

}

self.addEventListener("fetch",event=>{

    const request=event.request;

    if(request.method!=="GET")
        return;

    const url=new URL(request.url);

    if(url.origin!==self.location.origin)
        return;

    if(request.mode==="navigate"){

        event.respondWith(
            networkFirst(request,"./index.html")
        );

        return;

    }

    event.respondWith(
        networkFirst(request,null)
    );

});
