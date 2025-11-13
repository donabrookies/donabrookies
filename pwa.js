// PWA Manager para Dona Brookies
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.checkPWAStatus();
    this.setupOfflineDetection();
  }

  // Registrar Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado com sucesso:', registration);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Nova versão do Service Worker encontrada:', newWorker);
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });

      } catch (error) {
        console.error('❌ Falha no registro do Service Worker:', error);
      }
    }
  }

  // Configurar prompt de instalação
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 Evento beforeinstallprompt disparado');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', (e) => {
      console.log('🎉 App instalado com sucesso!');
      this.isInstalled = true;
      this.hideInstallPrompt();
      this.showToast('App instalado com sucesso! 🎉', 'success');
    });
  }

  // Verificar status do PWA
  checkPWAStatus() {
    // Verificar se está em modo standalone (instalado)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('📱 App rodando em modo standalone');
    }

    // Verificar se está no iOS (tratamento especial)
    this.detectIOS();
  }

  // Detectar iOS e aplicar correções específicas
  detectIOS() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      console.log('🍎 Dispositivo iOS detectado');
      document.body.classList.add('ios-device');
      
      // Correções específicas para iOS
      this.applyIOSFixes();
    }
  }

  // Aplicar correções para iOS
  applyIOSFixes() {
    // Prevenir zoom em inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        document.body.style.fontSize = '16px';
      });
      input.addEventListener('blur', () => {
        document.body.style.fontSize = '';
      });
    });

    // Correção para viewport height
    this.fixViewportHeight();
  }

  // Correção para altura da viewport no iOS
  fixViewportHeight() {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
  }

  // Mostrar prompt de instalação
  showInstallPrompt() {
    // Criar botão de instalação se não existir
    if (!document.getElementById('pwa-install-btn')) {
      const installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.className = 'pwa-install-btn';
      installBtn.innerHTML = `
        <i class="fas fa-download"></i>
        <span>Instalar App</span>
      `;
      installBtn.addEventListener('click', () => this.installApp());
      
      document.body.appendChild(installBtn);

      // Estilos para o botão de instalação
      this.addInstallButtonStyles();
    }
  }

  // Esconder prompt de instalação
  hideInstallPrompt() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  }

  // Instalar app
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`📱 Usuário ${outcome} a instalação`);
      this.deferredPrompt = null;
    }
  }

  // Mostrar notificação de atualização
  showUpdateNotification() {
    if (this.shouldShowUpdateNotification()) {
      const updateNotification = document.createElement('div');
      updateNotification.className = 'pwa-update-notification';
      updateNotification.innerHTML = `
        <div class="update-content">
          <i class="fas fa-sync-alt"></i>
          <div class="update-text">
            <strong>Nova versão disponível!</strong>
            <span>Atualize para a versão mais recente.</span>
          </div>
          <button id="update-btn" class="update-btn">
            Atualizar
          </button>
        </div>
      `;

      document.body.appendChild(updateNotification);

      // Estilos para notificação de atualização
      this.addUpdateNotificationStyles();

      document.getElementById('update-btn').addEventListener('click', () => {
        window.location.reload();
      });

      // Auto-remover após 10 segundos
      setTimeout(() => {
        if (updateNotification.parentNode) {
          updateNotification.remove();
        }
      }, 10000);
    }
  }

  // Verificar se deve mostrar notificação de atualização
  shouldShowUpdateNotification() {
    return !document.hidden && this.isInstalled;
  }

  // Configurar detecção de offline
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      console.log('✅ Conexão restaurada');
      this.showToast('Conexão restaurada', 'success');
      document.body.classList.remove('offline');
    });

    window.addEventListener('offline', () => {
      console.log('❌ Sem conexão');
      this.showToast('Você está offline', 'warning');
      document.body.classList.add('offline');
    });

    // Verificar status inicial
    if (!navigator.onLine) {
      document.body.classList.add('offline');
    }
  }

  // Pedir permissão para notificações
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('❌ Este navegador não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Permissão para notificações já concedida');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Permissão para notificações concedida');
        this.subscribeToPushNotifications();
        return true;
      }
    }

    console.log('❌ Permissão para notificações negada');
    return false;
  }

  // Inscrever para notificações push
  async subscribeToPushNotifications() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array('BEl62iUYgUivxjIx31uP5ZwXcR1cQzF9p9V6a7_t9JQ')
      });

      console.log('✅ Inscrito para notificações push:', subscription);
      await this.sendSubscriptionToServer(subscription);
      
    } catch (error) {
      console.error('❌ Erro na inscrição de notificações:', error);
    }
  }

  // Converter chave para Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Enviar inscrição para o servidor
  async sendSubscriptionToServer(subscription) {
    // Aqui você enviaria a subscription para seu backend
    // para poder enviar notificações posteriormente
    console.log('📤 Enviando subscription para o servidor:', subscription);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription })
      });

      if (response.ok) {
        console.log('✅ Subscription enviada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar subscription:', error);
    }
  }

  // Mostrar toast (reutilizando a função existente)
  showToast(message, type = 'success') {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      // Fallback se a função não existir
      console.log(`📢 ${type}: ${message}`);
    }
  }

  // Adicionar estilos para o botão de instalação
  addInstallButtonStyles() {
    const styles = `
      .pwa-install-btn {
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: linear-gradient(135deg, var(--urbanz-primary) 0%, var(--urbanz-dark) 100%);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        animation: pulse 2s infinite;
      }

      .pwa-install-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      .pwa-update-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border: 2px solid var(--urbanz-primary);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        max-width: 400px;
        width: 90%;
      }

      .update-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .update-content i {
        color: var(--urbanz-primary);
        font-size: 20px;
      }

      .update-text {
        flex: 1;
      }

      .update-text strong {
        display: block;
        margin-bottom: 4px;
      }

      .update-text span {
        font-size: 14px;
        color: #666;
      }

      .update-btn {
        background: var(--urbanz-primary);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        cursor: pointer;
        font-weight: 600;
      }

      .update-btn:hover {
        background: var(--urbanz-dark);
      }

      body.offline::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #ef4444;
        z-index: 10000;
      }

      body.ios-device {
        /* Correções específicas para iOS */
        -webkit-touch-callout: none;
        -webkit-user-select: none;
      }

      :root {
        --vh: 1vh;
      }

      .min-h-screen {
        min-height: calc(var(--vh, 1vh) * 100);
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Adicionar estilos para notificação de atualização
  addUpdateNotificationStyles() {
    // Já incluído no método addInstallButtonStyles
  }
}

// Inicializar PWA Manager quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.pwaManager = new PWAManager();
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAManager;
}