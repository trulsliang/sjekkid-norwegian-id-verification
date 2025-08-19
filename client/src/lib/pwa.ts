// PWA utilities for service worker registration and app installation

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, refresh the page
              window.location.reload();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

// Handle app installation prompt
export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA: Install prompt triggered');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button or notification
    showInstallPrompt();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA: App was installed');
    deferredPrompt = null;
    
    // Hide install prompt
    hideInstallPrompt();
    
    // Track installation for analytics
    trackAppInstallation();
  });
}

// Show install prompt to user
function showInstallPrompt(): void {
  // Create install notification
  const installBanner = document.createElement('div');
  installBanner.id = 'pwa-install-banner';
  installBanner.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 shadow-lg';
  installBanner.innerHTML = `
    <div class="max-w-md mx-auto flex items-center justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium">Installer SJEKK ID-appen</p>
        <p class="text-xs opacity-90">Få raskere tilgang og offline funksjonalitet</p>
      </div>
      <div class="flex space-x-2">
        <button id="pwa-install-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium">
          Installer
        </button>
        <button id="pwa-dismiss-btn" class="text-white opacity-75 text-xs">
          ✕
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(installBanner);

  // Handle install button click
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('PWA: User choice:', choiceResult.outcome);
      deferredPrompt = null;
    }
    hideInstallPrompt();
  });

  // Handle dismiss button
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    hideInstallPrompt();
  });
}

// Hide install prompt
function hideInstallPrompt(): void {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.remove();
  }
}

// Check if app is running as PWA
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
}

// Check if app can be installed
export function canInstall(): boolean {
  return deferredPrompt !== null;
}

// Trigger install manually
export async function installApp(): Promise<boolean> {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return choiceResult.outcome === 'accepted';
  }
  return false;
}

// Track app installation for analytics
function trackAppInstallation(): void {
  // Track installation event
  console.log('PWA: App installation tracked');
  
  // You could send this to analytics service
  // analytics.track('pwa_installed', {
  //   timestamp: new Date().toISOString(),
  //   userAgent: navigator.userAgent
  // });
}

// Handle network status changes
export function setupNetworkHandling(): void {
  window.addEventListener('online', () => {
    console.log('PWA: Back online');
    showNetworkStatus('Du er tilkoblet igjen', 'success');
  });

  window.addEventListener('offline', () => {
    console.log('PWA: Gone offline');
    showNetworkStatus('Du er frakoblet. Noen funksjoner kan være begrenset.', 'warning');
  });
}

// Show network status notification
function showNetworkStatus(message: string, type: 'success' | 'warning'): void {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 p-3 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize PWA features
export function initializePWA(): void {
  // Register service worker
  registerServiceWorker();
  
  // Setup install prompt
  setupInstallPrompt();
  
  // Setup network handling
  setupNetworkHandling();
  
  // Log PWA status
  console.log('PWA: Initialization complete', {
    isPWA: isPWA(),
    canInstall: canInstall(),
    isOnline: navigator.onLine
  });
}