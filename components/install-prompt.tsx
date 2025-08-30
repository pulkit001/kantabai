"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)

  useEffect(() => {
    // Better device detection
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream
    const isAndroidDevice = /android/.test(userAgent) && !/windows phone/.test(userAgent)
    
    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)

    // Check if app is already installed (standalone mode)
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    
    setIsStandalone(isInStandaloneMode)

    // Don't show anything if already installed
    if (isInStandaloneMode) return

    // Listen for the beforeinstallprompt event (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt fired')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user dismissed recently
      const dismissed = localStorage.getItem('pwa-dismissed-android')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000 // Show more frequently for better UX
      
      if (!dismissed || Date.now() - dismissedTime > threeDaysInMs) {
        // Delay showing the prompt slightly for better UX
        setTimeout(() => setShowInstallPrompt(true), 2000)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // For iOS, show manual instructions if not installed and not dismissed
    if (isIOSDevice) {
      const dismissed = localStorage.getItem('pwa-dismissed-ios')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000
      
      if (!dismissed || Date.now() - dismissedTime > threeDaysInMs) {
        setTimeout(() => setShowInstallPrompt(true), 3000)
      }
    }

    // For Android devices that don't trigger beforeinstallprompt (e.g., Firefox, Samsung Internet)
    if (isAndroidDevice && !deferredPrompt) {
      const dismissed = localStorage.getItem('pwa-dismissed-android-manual')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000
      
      if (!dismissed || Date.now() - dismissedTime > threeDaysInMs) {
        // Wait longer to see if beforeinstallprompt fires
        setTimeout(() => {
          if (!deferredPrompt) {
            setShowManualInstructions(true)
            setShowInstallPrompt(true)
          }
        }, 5000)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [deferredPrompt])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt, show manual instructions
      setShowManualInstructions(true)
      return
    }

    try {
      // Show the native install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setShowInstallPrompt(false)
      } else {
        console.log('User dismissed the install prompt')
        localStorage.setItem('pwa-dismissed-android', Date.now().toString())
        setShowInstallPrompt(false)
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error showing install prompt:', error)
      // Fallback to manual instructions
      setShowManualInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    if (isIOS) {
      localStorage.setItem('pwa-dismissed-ios', Date.now().toString())
    } else if (showManualInstructions) {
      localStorage.setItem('pwa-dismissed-android-manual', Date.now().toString())
    } else {
      localStorage.setItem('pwa-dismissed-android', Date.now().toString())
    }
  }

  // Don't show if already installed
  if (isStandalone) return null

  // Don't show if prompt not available and not iOS
  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Install Kantabai
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {isIOS 
                ? "Tap the share button and select 'Add to Home Screen' for the best experience."
                : isAndroid
                ? deferredPrompt 
                  ? "Install this app for quick access and offline functionality."
                  : "Add this app to your home screen for the best experience."
                : "Install this app on your device for quick access and better performance."
              }
            </p>
            <div className="flex gap-2">
              {!isIOS && (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {deferredPrompt ? 'Install' : 'Show Instructions'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="text-xs"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* iOS Instructions */}
        {isIOS && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">To install on iOS:</p>
              <p>1. Tap the Share button <span className="inline-block">📤</span></p>
              <p>2. Select &quot;Add to Home Screen&quot;</p>
              <p>3. Tap &quot;Add&quot; to confirm</p>
            </div>
          </div>
        )}
        
        {/* Android Manual Instructions */}
        {isAndroid && showManualInstructions && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">To install on Android:</p>
              <p>
                <strong>Chrome:</strong> Tap menu (⋮) → &quot;Add to Home screen&quot;
              </p>
              <p>
                <strong>Firefox:</strong> Tap menu (⋮) → &quot;Install&quot;
              </p>
              <p>
                <strong>Samsung Internet:</strong> Tap menu → &quot;Add page to&quot; → &quot;Home screen&quot;
              </p>
              <p>
                <strong>Edge:</strong> Tap menu (⋯) → &quot;Add to phone&quot;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
