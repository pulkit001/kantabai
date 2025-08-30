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
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Check if app is already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(isInStandaloneMode)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Don't show if already installed or if user dismissed recently
      const dismissed = localStorage.getItem('pwa-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000
      
      if (!dismissed || Date.now() - dismissedTime > oneWeekInMs) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show prompt if not in standalone mode and not dismissed
    if (isIOSDevice && !isInStandaloneMode) {
      const dismissed = localStorage.getItem('pwa-dismissed-ios')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000
      
      if (!dismissed || Date.now() - dismissedTime > oneWeekInMs) {
        setShowInstallPrompt(true)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) return

    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
        localStorage.setItem('pwa-dismissed', Date.now().toString())
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    if (isIOS) {
      localStorage.setItem('pwa-dismissed-ios', Date.now().toString())
    } else {
      localStorage.setItem('pwa-dismissed', Date.now().toString())
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
                  Install
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
        
        {isIOS && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>To install:</p>
              <p>1. Tap the Share button <span className="inline-block">📤</span></p>
              <p>2. Select "Add to Home Screen"</p>
              <p>3. Tap "Add" to confirm</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
