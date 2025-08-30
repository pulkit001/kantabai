"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ChefHat, ChevronDown, Plus, Home, Building2 } from 'lucide-react'
import Link from 'next/link'

interface Kitchen {
  id: number
  name: string
  location: string | null
  isDefault: boolean
}

interface KitchenSelectorProps {
  kitchens: Kitchen[]
  selectedKitchenId?: number
  onKitchenSelect: (kitchenId: number) => void
}

export default function KitchenSelector({ 
  kitchens, 
  selectedKitchenId, 
  onKitchenSelect 
}: KitchenSelectorProps) {
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null)

  useEffect(() => {
    if (selectedKitchenId) {
      const kitchen = kitchens.find(k => k.id === selectedKitchenId)
      setSelectedKitchen(kitchen || null)
    } else {
      // Auto-select default kitchen or first kitchen
      const defaultKitchen = kitchens.find(k => k.isDefault) || kitchens[0]
      if (defaultKitchen) {
        setSelectedKitchen(defaultKitchen)
        onKitchenSelect(defaultKitchen.id)
      }
    }
  }, [kitchens, selectedKitchenId, onKitchenSelect])

  const handleKitchenSelect = (kitchen: Kitchen) => {
    setSelectedKitchen(kitchen)
    onKitchenSelect(kitchen.id)
  }

  if (kitchens.length === 0) {
    return (
      <Button asChild variant="outline">
        <Link href="/kitchen/setup">
          <Plus className="h-4 w-4 mr-2" />
          Create Kitchen
        </Link>
      </Button>
    )
  }

  if (kitchens.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/50">
          <ChefHat className="h-4 w-4 text-primary" />
          <span className="font-medium">{kitchens[0].name}</span>
          {kitchens[0].location && (
            <span className="text-sm text-muted-foreground">• {kitchens[0].location}</span>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/kitchen/setup">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[200px]">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {selectedKitchen?.name || 'Select Kitchen'}
              </span>
              {selectedKitchen?.location && (
                <span className="text-sm text-muted-foreground">
                  • {selectedKitchen.location}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          <DropdownMenuLabel>Select Kitchen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {kitchens.map((kitchen) => (
            <DropdownMenuItem 
              key={kitchen.id}
              onClick={() => handleKitchenSelect(kitchen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                {kitchen.location ? (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Home className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{kitchen.name}</div>
                  {kitchen.location && (
                    <div className="text-sm text-muted-foreground">{kitchen.location}</div>
                  )}
                </div>
                {kitchen.isDefault && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Default
                  </span>
                )}
                {selectedKitchen?.id === kitchen.id && (
                  <div className="h-2 w-2 bg-primary rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/kitchen/setup" className="flex items-center gap-2 cursor-pointer">
              <Plus className="h-4 w-4" />
              Create New Kitchen
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
