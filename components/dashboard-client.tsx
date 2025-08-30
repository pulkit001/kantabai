"use client"

import { useState, useEffect } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChefHat, Package, AlertTriangle, BookOpen, Plus, Star } from "lucide-react"
import KitchenSelector from "@/components/kitchen-selector"

interface Kitchen {
  id: number
  name: string
  location: string | null
  description: string | null
  isDefault: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface KitchenStats {
  totalItems: number
  expiringCount: number
}

interface DashboardClientProps {
  kitchens: Kitchen[]
  user: {
    firstName?: string | null
    emailAddress?: string
  }
}

export default function DashboardClient({ kitchens, user }: DashboardClientProps) {
  const [selectedKitchenId, setSelectedKitchenId] = useState<number | null>(null)
  const [kitchenStats, setKitchenStats] = useState<KitchenStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [kitchenList, setKitchenList] = useState(kitchens)
  const [isChangingDefault, setIsChangingDefault] = useState<number | null>(null)

  const selectedKitchen = kitchenList.find(k => k.id === selectedKitchenId) || null

  // Update kitchen list when props change
  useEffect(() => {
    setKitchenList(kitchens)
  }, [kitchens])

  // Auto-select default kitchen or first kitchen
  useEffect(() => {
    if (kitchenList.length > 0 && !selectedKitchenId) {
      const defaultKitchen = kitchenList.find(k => k.isDefault) || kitchenList[0]
      setSelectedKitchenId(defaultKitchen.id)
    }
  }, [kitchenList, selectedKitchenId])

  // Handle setting kitchen as default
  const handleSetDefault = async (kitchenId: number) => {
    if (isChangingDefault) return // Prevent multiple requests
    
    setIsChangingDefault(kitchenId)
    try {
      const response = await fetch(`/api/kitchens/${kitchenId}/default`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Update kitchen list to reflect new default
        setKitchenList(prev => prev.map(kitchen => ({
          ...kitchen,
          isDefault: kitchen.id === kitchenId
        })))
      } else {
        console.error('Failed to set default kitchen')
      }
    } catch (error) {
      console.error('Error setting default kitchen:', error)
    } finally {
      setIsChangingDefault(null)
    }
  }

  // Load kitchen stats when kitchen is selected
  useEffect(() => {
    if (selectedKitchenId) {
      setIsLoadingStats(true)
      fetch(`/api/kitchens/${selectedKitchenId}/stats`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error('Error loading kitchen stats:', data.error)
            setKitchenStats({ totalItems: 0, expiringCount: 0 })
          } else {
            setKitchenStats(data)
          }
        })
        .catch(error => {
          console.error('Error loading kitchen stats:', error)
          setKitchenStats({ totalItems: 0, expiringCount: 0 })
        })
        .finally(() => setIsLoadingStats(false))
    }
  }, [selectedKitchenId])

  if (kitchens.length === 0) {
    return (
      <div className="container mx-auto py-4 md:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Kitchen Dashboard</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Welcome back, {user.firstName || user.emailAddress}! Let&apos;s set up your first kitchen.
            </p>
          </div>
          
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Kitchens Found</h2>
            <p className="text-muted-foreground mb-6">
              Create your first kitchen to start tracking ingredients and managing your pantry.
            </p>
            <Button size="lg" asChild>
              <Link href="/kitchen/setup">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Kitchen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 md:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Kitchen Dashboard</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Welcome back, {user.firstName || user.emailAddress}! 
                {selectedKitchen ? ` Managing ${selectedKitchen.name}` : " Select a kitchen to manage."}
              </p>
            </div>
            <KitchenSelector 
              kitchens={kitchenList}
              selectedKitchenId={selectedKitchenId || undefined}
              onKitchenSelect={setSelectedKitchenId}
            />
          </div>
        </div>

        {selectedKitchen && (
          <>
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 md:mb-8">
              <div className="p-4 md:p-6 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg md:text-xl font-semibold">Kitchen Items</h3>
                </div>
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  {isLoadingStats ? "Loading..." : 
                    kitchenStats ? `${kitchenStats.totalItems} total items` : "Track your ingredients and supplies"
                  }
                </p>
                <Button className="w-full md:w-auto" asChild>
                  <Link href={`/kitchen/ingredients?kitchenId=${selectedKitchenId}`}>
                    View Items
                  </Link>
                </Button>
              </div>
              
              <div className="p-4 md:p-6 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg md:text-xl font-semibold">Expiring Soon</h3>
                </div>
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  {isLoadingStats ? "Loading..." :
                    kitchenStats ? `${kitchenStats.expiringCount} items expiring within 7 days` : "Monitor expiration dates"
                  }
                </p>
                <Button variant="outline" className="w-full md:w-auto" asChild>
                  <Link href={`/kitchen/expiry?kitchenId=${selectedKitchenId}`}>
                    Check Expiry
                  </Link>
                </Button>
              </div>
              
              <div className="p-4 md:p-6 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg md:text-xl font-semibold">Recipes</h3>
                </div>
                <p className="text-muted-foreground mb-4 text-sm md:text-base">
                  Create recipes and check available ingredients
                </p>
                <Button variant="secondary" className="w-full md:w-auto">Browse Recipes</Button>
              </div>
            </div>

            {/* Kitchen Overview */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 mb-6 md:mb-8">
              <div className="p-4 md:p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  Kitchen Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {selectedKitchen.name}
                  </div>
                  {selectedKitchen.location && (
                    <div>
                      <span className="font-medium">Location:</span> {selectedKitchen.location}
                    </div>
                  )}
                  {selectedKitchen.description && (
                    <div>
                      <span className="font-medium">Description:</span> {selectedKitchen.description}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedKitchen.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-6 border rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Your Kitchens</h3>
                <div className="space-y-2">
                  {kitchenList.map((kitchen) => (
                    <div key={kitchen.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex-1">
                        <div className="font-medium">{kitchen.name}</div>
                        {kitchen.location && (
                          <div className="text-sm text-muted-foreground">{kitchen.location}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {kitchen.isDefault ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(kitchen.id)}
                            disabled={isChangingDefault === kitchen.id}
                            className="text-xs px-2 py-1 h-auto"
                          >
                            {isChangingDefault === kitchen.id ? (
                              "Setting..."
                            ) : (
                              <>
                                <Star className="h-3 w-3 mr-1" />
                                Set Default
                              </>
                            )}
                          </Button>
                        )}
                        {selectedKitchenId === kitchen.id && (
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                  <Link href="/kitchen/setup">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Kitchen
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* System Status */}
        <div className="p-4 md:p-6 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Kitchen Assistant Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>User Profile</span>
              <span className="text-green-600 dark:text-green-400">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>Kitchen Setup</span>
              <span className={kitchens.length > 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}>
                {kitchens.length > 0 ? "✓ Ready" : "📝 Pending Setup"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>Active Kitchens</span>
              <span className="text-green-600 dark:text-green-400">
                {kitchens.length} kitchen{kitchens.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>Database</span>
              <span className="text-green-600 dark:text-green-400">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between text-sm md:text-base">
              <span>PWA Installation</span>
              <span className="text-blue-600 dark:text-blue-400">📱 Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
