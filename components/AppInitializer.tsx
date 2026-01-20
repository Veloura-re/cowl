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

                // 1. Disable overlay so the webview sits BELOW the status bar (no overlap)
                await StatusBar.setOverlaysWebView({ overlay: false })

                // 2. Set Status Bar Background to Black
                await StatusBar.setBackgroundColor({ color: '#000000' })

                // 3. Set Status Bar Style to Dark (White text)
                await StatusBar.setStyle({ style: Style.Dark })

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
