'use client'

import { useEffect } from 'react'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App as CapacitorApp } from '@capacitor/app'
import { PushNotifications } from '@capacitor/push-notifications'

export default function AppInitializer() {
    useEffect(() => {
        const initApp = async () => {
            try {
                // Check if running on native platform
                await CapacitorApp.getInfo()

                // 1. Enable overlay so the webview sits BEHIND the status bar (edge-to-edge)
                await StatusBar.setOverlaysWebView({ overlay: true })

                // 2. Set Status Bar Background to Transparent (handled by overlay)
                // We don't want a solid color if we are doing edge-to-edge
                // But for safety, we set it to something compatible
                await StatusBar.setBackgroundColor({ color: '#00000000' })

                // 3. Set Status Bar Style to Dark (Light icons/text) for Dark Mode
                // Since this app defaults to a very dark emerald theme, Light style (white icons) is usually better
                await StatusBar.setStyle({ style: Style.Dark })

                // 4. Request Notification Permissions
                const permissionStatus = await PushNotifications.checkPermissions()
                if (permissionStatus.receive === 'prompt') {
                    await PushNotifications.requestPermissions()
                }

            } catch (err) {
                // Likely running on web or plugins not available
                console.log('Non-native environment or plugin missing', err)
            }
        }

        initApp()
    }, [])

    return null
}
