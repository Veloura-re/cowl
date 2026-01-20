'use client'

import { useEffect } from 'react'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App as CapacitorApp } from '@capacitor/app'

export default function AppInitializer() {
    useEffect(() => {
        const initApp = async () => {
            try {
                // Check if running on native platform
                const info = await CapacitorApp.getInfo()
                // Just a basic check, or rely on catch blocks if plugins fail in web

                // 1. Enable overlay so the webview sits BEHIND the status bar (edge-to-edge)
                await StatusBar.setOverlaysWebView({ overlay: true })

                // 2. Set Status Bar Background to White (translucent if overlay is true)
                await StatusBar.setBackgroundColor({ color: '#ffffff' })

                // 3. Set Status Bar Style to Light (Dark icons/text)
                await StatusBar.setStyle({ style: Style.Light })

                // 3. Hide Splash Screen if manual hiding is preferred (usually handled by config)
                // await SplashScreen.hide()
            } catch (err) {
                // Likely running on web or plugins not available
                console.log('Non-native environment or plugin missing', err)
            }
        }

        initApp()
    }, [])

    return null
}
