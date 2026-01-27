'use client'

import { useEffect } from 'react'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App as CapacitorApp } from '@capacitor/app'
import { PushNotifications } from '@capacitor/push-notifications'
import { useTheme } from 'next-themes'

export default function AppInitializer() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        const initApp = async () => {
            try {
                // Check if running on native platform
                await CapacitorApp.getInfo()

                // 1. Enable overlay so the webview sits BEHIND the status bar (edge-to-edge)
                await StatusBar.setOverlaysWebView({ overlay: true })

                // 2. Set Status Bar Background to Transparent (handled by overlay)
                await StatusBar.setBackgroundColor({ color: '#00000000' })

                // 3. Request Notification Permissions (Remote & Local)
                const pushPermission = await PushNotifications.checkPermissions()
                if (pushPermission.receive === 'prompt') {
                    await PushNotifications.requestPermissions()
                }

                const { LocalNotifications } = await import('@capacitor/local-notifications')
                const localPermission = await LocalNotifications.checkPermissions()
                if (localPermission.display === 'prompt') {
                    await LocalNotifications.requestPermissions()
                }

            } catch (err) {
                // Likely running on web or plugins not available
                console.log('Non-native environment or plugin missing', err)

                // Fallback: Register Service Worker for PWA notifications
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js').then(reg => {
                        console.log('Service Worker registered:', reg.scope);
                    }).catch(err => {
                        console.log('Service Worker registration failed:', err);
                    });
                }
            }
        }

        initApp()
    }, [])

    // Separate effect to handle theme changes dynamically
    useEffect(() => {
        const updateStatusBarStyle = async () => {
            try {
                // Ensure we are on a native platform
                await CapacitorApp.getInfo()

                if (resolvedTheme === 'light') {
                    // Light mode -> Dark icons
                    await StatusBar.setStyle({ style: Style.Light })
                } else {
                    // Dark mode (or system dark) -> Light icons
                    await StatusBar.setStyle({ style: Style.Dark })
                }
            } catch (err) {
                // Ignore errors on non-native logic
            }
        }

        updateStatusBarStyle()
    }, [resolvedTheme])

    return null
}


