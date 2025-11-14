// Service Worker para Dona Brookies PWA
const CACHE_NAME = 'dona-brookies-v2.0.0';
const STATIC_CACHE = 'static-cache-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v2';

// Arquivos para cache estático
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/imagem_72x72.png',
    '/imagem_192x192.png',
    '/imagem_512x512.png',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Cache estático sendo preenchido...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Service Worker instalado com sucesso!');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Erro na instalação do Service Worker:', error);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker ativando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker ativado com sucesso!');
                return self.clients.claim();
            })
    );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
    // Não cachear requisições para a API
    if (event.request.url.includes('/api/') || event.request.url.includes('vercel.app')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then((fetchResponse) => {
                        // Só cachear se for uma resposta válida
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }

                        const responseToCache = fetchResponse.clone();

                        caches.open(DYNAMIC_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return fetchResponse;
                    })
                    .catch(() => {
                        // Fallback para página offline se disponível
                        if (event.request.destination === 'document') {
                            return caches.match('/');
                        }
                    });
            })
    );
});

// ===== SISTEMA DE NOTIFICAÇÕES PUSH =====

// Escutar mensagens push
self.addEventListener('push', (event) => {
    console.log('📨 Push message received', event);
    
    let data = {};
    
    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.error('❌ Erro ao processar dados push:', error);
        data = {
            title: 'Dona Brookies',
            body: 'Nova mensagem da Dona Brookies!',
            icon: '/imagem_192x192.png'
        };
    }

    const options = {
        body: data.body || 'Nova notificação da Dona Brookies',
        icon: data.icon || '/imagem_192x192.png',
        badge: data.badge || '/imagem_192x192.png',
        image: data.image || '/imagem_192x192.png',
        data: data.data || { url: '/' },
        actions: data.actions || [
            {
                action: 'open',
                title: 'Abrir App'
            },
            {
                action: 'close', 
                title: 'Fechar'
            }
        ],
        requireInteraction: true,
        vibrate: [200, 100, 200],
        tag: data.tag || 'dona-brookies-notification'
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Dona Brookies', options)
    );
});

// Escutar cliques em notificações
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification click received', event);
    
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // Verificar se já existe uma janela/tab aberta
            for (let client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }

            // Se não existe, abrir nova janela
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Escutar ações de notificação
self.addEventListener('notificationclose', (event) => {
    console.log('❌ Notification closed', event);
});

// Escutar mensagens do cliente
self.addEventListener('message', (event) => {
    console.log('📩 Message received from client:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('🔔 Service Worker carregado com sistema de notificações!');