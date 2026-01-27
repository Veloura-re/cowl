import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function showNotification(title: string, message: string, id?: string) {
    try {
        // 1. Check if running on Native (Capacitor)
        if (Capacitor.isNativePlatform()) {
            const hasPermission = await LocalNotifications.checkPermissions();
            if (hasPermission.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: title,
                        body: message,
                        id: id ? parseInt(id.replace(/\D/g, '').slice(-8)) || 1 : Math.floor(Math.random() * 100000),
                        schedule: { at: new Date(Date.now() + 100) }, // Nearly immediate
                        sound: 'default',
                        attachments: [],
                        actionTypeId: '',
                        extra: null
                    }
                ]
            });
            return;
        }

        // 2. Fallback to Service Worker / PWA Notification
        if ('serviceWorker' in navigator && 'Notification' in window) {
            const registration = await navigator.serviceWorker.ready;
            if (Notification.permission === 'granted') {
                registration.showNotification(title, {
                    body: message,
                    icon: '/icon.png',
                    badge: '/icon.png',
                    tag: id || 'claire-notif',
                    renotify: true
                } as any);
                return;
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    registration.showNotification(title, {
                        body: message,
                        icon: '/icon.png',
                        badge: '/icon.png',
                        tag: id || 'claire-notif',
                        renotify: true
                    } as any);
                    return;
                }
            }
        }

        // 3. Final Fallback: Standard Browser Notification (Foreground only)
        if ('Notification' in window && Notification.permission === 'granted') {
            new window.Notification(title, {
                body: message,
                icon: '/icon.png'
            });
        }
    } catch (error) {
        console.error('Notification error:', error);
    }
}
