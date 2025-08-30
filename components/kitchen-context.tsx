"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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

interface KitchenContextType {
  selectedKitchen: Kitchen | null
  selectedKitchenId: number | null
  setSelectedKitchenId: (kitchenId: number) => void
  kitchens: Kitchen[]
  setKitchens: (kitchens: Kitchen[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const KitchenContext = createContext<KitchenContextType | undefined>(undefined)

export function useKitchen() {
  const context = useContext(KitchenContext)
  if (context === undefined) {
    throw new Error('useKitchen must be used within a KitchenProvider')
  }
  return context
}

interface KitchenProviderProps {
  children: ReactNode
  initialKitchens?: Kitchen[]
  initialSelectedKitchenId?: number
}

export function KitchenProvider({ 
  children, 
  initialKitchens = [], 
  initialSelectedKitchenId 
}: KitchenProviderProps) {
  const [kitchens, setKitchens] = useState<Kitchen[]>(initialKitchens)
  const [selectedKitchenId, setSelectedKitchenId] = useState<number | null>(
    initialSelectedKitchenId || null
  )
  const [isLoading, setIsLoading] = useState(false)

  // Find the selected kitchen object
  const selectedKitchen = kitchens.find(k => k.id === selectedKitchenId) || null

  // Auto-select default kitchen if no kitchen is selected
  useEffect(() => {
    if (!selectedKitchenId && kitchens.length > 0) {
      const defaultKitchen = kitchens.find(k => k.isDefault) || kitchens[0]
      if (defaultKitchen) {
        setSelectedKitchenId(defaultKitchen.id)
      }
    }
  }, [kitchens, selectedKitchenId])

  // Store selected kitchen in localStorage
  useEffect(() => {
    if (selectedKitchenId) {
      localStorage.setItem('selectedKitchenId', selectedKitchenId.toString())
    }
  }, [selectedKitchenId])

  // Load selected kitchen from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('selectedKitchenId')
    if (stored && kitchens.length > 0) {
      const kitchenId = parseInt(stored)
      const kitchenExists = kitchens.find(k => k.id === kitchenId)
      if (kitchenExists) {
        setSelectedKitchenId(kitchenId)
      }
    }
  }, [kitchens])

  const handleSetSelectedKitchenId = (kitchenId: number) => {
    setSelectedKitchenId(kitchenId)
  }

  const value: KitchenContextType = {
    selectedKitchen,
    selectedKitchenId,
    setSelectedKitchenId: handleSetSelectedKitchenId,
    kitchens,
    setKitchens,
    isLoading,
    setIsLoading,
  }

  return (
    <KitchenContext.Provider value={value}>
      {children}
    </KitchenContext.Provider>
  )
}
