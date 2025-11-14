// Service Worker para PWA - Dona Brookies
const CACHE_NAME = 'dona-brookies-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('✅ Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Service Worker: Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('❌ Erro ao criar cache:', error);
            })
    );
    self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Ativando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch - Estratégia Network First, depois Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone a resposta
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// ===== NOTIFICAÇÕES PUSH =====

// Escutar notificações push
self.addEventListener('push', (event) => {
    console.log('🔔 Service Worker: Notificação push recebida');

    let notificationData = {
        title: 'Dona Brookies',
        body: 'Nova notificação!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
            url: '/'
        }
    };

    if (event.data) {
        try {
            notificationData = event.data.json();
            console.log('📨 Dados da notificação:', notificationData);
        } catch (error) {
            console.error('❌ Erro ao processar dados da notificação:', error);
            notificationData.body = event.data.text();
        }
    }

    const options = {
        body: notificationData.body || notificationData.message,
        icon: notificationData.icon || '/icons/icon-192x192.png',
        badge: notificationData.badge || '/icons/icon-192x192.png',
        image: notificationData.image,
        vibrate: [200, 100, 200],
        data: notificationData.data || { url: notificationData.url || '/' },
        actions: notificationData.actions || [
            {
                action: 'open',
                title: 'Abrir App'
            },
            {
                action: 'close',
                title: 'Fechar'
            }
        ],
        requireInteraction: false,
        tag: 'dona-brookies-notification',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
            .then(() => {
                console.log('✅ Notificação exibida com sucesso!');
            })
            .catch((error) => {
                console.error('❌ Erro ao exibir notificação:', error);
            })
    );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notificação clicada:', event.action);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Verificar se já existe uma janela aberta
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Se não houver janela aberta, abrir uma nova
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Fechamento da notificação
self.addEventListener('notificationclose', (event) => {
    console.log('🔕 Notificação fechada:', event.notification.tag);
});

console.log('🚀 Service Worker carregado com sucesso!');
