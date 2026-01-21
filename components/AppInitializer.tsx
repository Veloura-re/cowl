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

                // 2. Set Status Bar Background to White (translucent if overlay is true)
                await StatusBar.setBackgroundColor({ color: '#ffffff' })

                // 3. Set Status Bar Style to Light (Dark icons/text)
                await StatusBar.setStyle({ style: Style.Light })

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
