// Push Notification Service for PWA

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported');
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  async subscribe(vapidPublicKey?: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return null;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('Push notification permission denied');
      return null;
    }

    try {
      const subscribeOptions: PushSubscriptionOptions = {
        userVisibleOnly: true,
      };

      if (vapidPublicKey) {
        subscribeOptions.applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
      }

      this.subscription = await this.registration.pushManager.subscribe(subscribeOptions);
      
      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      if (success) {
        this.subscription = null;
        // Notify server about unsubscription
        await this.removeSubscriptionFromServer();
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return;
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.svg',
      badge: payload.badge || '/icons/badge-72x72.svg',
      tag: payload.tag,
      data: payload.data,
      actions: payload.actions,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent,
      vibrate: [200, 100, 200],
    };

    await this.registration.showNotification(payload.title, options);
  }

  // Predefined notification types for waste management system
  async showWasteAnalysisComplete(batchId: string, results: any): Promise<void> {
    await this.showLocalNotification({
      title: 'Waste Analysis Complete',
      body: `Analysis for batch ${batchId} is ready`,
      tag: 'waste-analysis',
      data: { type: 'analysis-complete', batchId, results },
      actions: [
        { action: 'view', title: 'View Results', icon: '/icons/checkmark.svg' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/xmark.svg' },
      ],
    });
  }

  async showContaminationAlert(batchId: string, contaminationType: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Contamination Detected',
      body: `${contaminationType} contamination found in batch ${batchId}`,
      tag: 'contamination-alert',
      data: { type: 'contamination', batchId, contaminationType },
      requireInteraction: true,
      actions: [
        { action: 'investigate', title: 'Investigate', icon: '/icons/checkmark.svg' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/xmark.svg' },
      ],
    });
  }

  async showSystemAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    const icons = {
      info: '/icons/icon-192x192.svg',
      warning: '/icons/detection-96x96.svg',
      error: '/icons/detection-96x96.svg',
    };

    await this.showLocalNotification({
      title: 'System Alert',
      body: message,
      tag: 'system-alert',
      icon: icons[severity],
      data: { type: 'system-alert', severity, message },
      requireInteraction: severity === 'error',
    });
  }

  async showCertificateGenerated(certificateId: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Certificate Generated',
      body: `Blockchain certificate ${certificateId} has been created`,
      tag: 'certificate',
      data: { type: 'certificate', certificateId },
      actions: [
        { action: 'view', title: 'View Certificate', icon: '/icons/checkmark.svg' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/xmark.svg' },
      ],
    });
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Push subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      // Don't throw error to avoid breaking the subscription process
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Push subscription removed from server successfully');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

// Hook for React components
export function usePushNotifications() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [subscription, setSubscription] = React.useState<PushSubscription | null>(null);

  React.useEffect(() => {
    const initializeNotifications = async () => {
      const supported = await pushNotificationService.initialize();
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        const currentSubscription = await pushNotificationService.getSubscription();
        setSubscription(currentSubscription);
      }
    };

    initializeNotifications();
  }, []);

  const requestPermission = async () => {
    const newPermission = await pushNotificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const subscribe = async (vapidPublicKey?: string) => {
    const newSubscription = await pushNotificationService.subscribe(vapidPublicKey);
    setSubscription(newSubscription);
    return newSubscription;
  };

  const unsubscribe = async () => {
    const success = await pushNotificationService.unsubscribe();
    if (success) {
      setSubscription(null);
    }
    return success;
  };

  const showNotification = (payload: PushNotificationPayload) => {
    return pushNotificationService.showLocalNotification(payload);
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    // Convenience methods
    showWasteAnalysisComplete: pushNotificationService.showWasteAnalysisComplete.bind(pushNotificationService),
    showContaminationAlert: pushNotificationService.showContaminationAlert.bind(pushNotificationService),
    showSystemAlert: pushNotificationService.showSystemAlert.bind(pushNotificationService),
    showCertificateGenerated: pushNotificationService.showCertificateGenerated.bind(pushNotificationService),
  };
}

// React import for the hook
import React from 'react';