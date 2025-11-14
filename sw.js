// sw.js - Service Worker atualizado para notificações push
const CACHE_NAME = 'dona-brookies-v1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/imagem_192x192.png',
  '/imagem_512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker ativado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna do cache se encontrado, senão faz a requisição
        return response || fetch(event.request);
      }
    )
  );
});

// ===== NOTIFICAÇÕES PUSH =====

// Manipular notificações push recebidas
self.addEventListener('push', event => {
  console.log('Notificação push recebida:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Erro ao processar dados da notificação:', error);
    data = {
      title: 'Dona Brookies',
      body: 'Nova mensagem da Dona Brookies!',
      icon: '/icons/icon-192x192.png'
    };
  }

  const options = {
    body: data.body || 'Nova mensagem da Dona Brookies!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Dona Brookies', options)
  );
});

// Manipular clique nas notificações
self.addEventListener('notificationclick', event => {
  console.log('Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Verificar se já existe uma janela/tab aberta
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não existir, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
    );
  }
});

// Manipular fechamento de notificações
self.addEventListener('notificationclose', event => {
  console.log('Notificação fechada:', event);
});