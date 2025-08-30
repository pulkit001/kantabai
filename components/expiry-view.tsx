"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Clock, 
  Calendar,
  Package,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { useState } from 'react'

interface ExpiringItem {
  id: number
  name: string
  brand?: string | null
  quantity: number
  unit?: string | null
  expiryDate?: string | null
  location?: string | null
  status: "Fresh" | "Expiring" | "Expired" | null
}

interface ExpiryViewProps {
  expiringToday: ExpiringItem[]
  expiringWeek: ExpiringItem[]
  expiringMonth: ExpiringItem[]
  kitchenId: number
}

export default function ExpiryView({
  expiringToday,
  expiringWeek,
  expiringMonth,
  kitchenId
}: ExpiryViewProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingItem, setDeletingItem] = useState<number | null>(null)

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No date'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Get priority level
  const getPriorityLevel = (days: number | null) => {
    if (days === null) return 'unknown'
    if (days < 0) return 'expired'
    if (days === 0) return 'today'
    if (days <= 3) return 'urgent'
    if (days <= 7) return 'warning'
    return 'normal'
  }

  // Get priority color
  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'today': return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'normal': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Handle marking item as used (delete from database)
  const handleItemUsed = async (itemId: number) => {
    if (deletingItem) return // Prevent multiple requests
    
    setDeletingItem(itemId)
    try {
      const response = await fetch(`/api/ingredients/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        console.error('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setDeletingItem(null)
    }
  }

  // Render item card
  const renderItemCard = (item: ExpiringItem) => {
    const days = getDaysUntilExpiry(item.expiryDate)
    const priority = getPriorityLevel(days)
    const priorityColor = getPriorityColor(priority)

    return (
      <div key={item.id} className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold">{item.name}</h3>
            {item.brand && (
              <p className="text-sm text-muted-foreground">{item.brand}</p>
            )}
          </div>
          
          <Badge className={priorityColor}>
            {priority === 'expired' && `${Math.abs(days!)} days ago`}
            {priority === 'today' && 'Today'}
            {priority === 'urgent' && `${days} days`}
            {priority === 'warning' && `${days} days`}
            {priority === 'normal' && `${days} days`}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {item.quantity} {item.unit || 'units'}
          </span>
          
          {item.location && (
            <span className="text-muted-foreground">{item.location}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Expires: {formatDate(item.expiryDate)}</span>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7"
              onClick={() => handleItemUsed(item.id)}
              disabled={deletingItem === item.id}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {deletingItem === item.id ? 'Removing...' : 'Used'}
            </Button>
            <Button size="sm" variant="outline" className="h-7">
              <RefreshCw className="h-3 w-3 mr-1" />
              Extend
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Update expiry statuses
  const updateExpiryStatuses = async () => {
    setIsUpdating(true)
    try {
      await fetch('/api/ingredients/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kitchenId }),
      })
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating expiry statuses:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span className="font-medium">Expiry Overview</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={updateExpiryStatuses}
          disabled={isUpdating}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Refresh Status'}
        </Button>
      </div>

      {/* Critical Section - Expired & Expiring Today */}
      {(expiringToday.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">
              Urgent Attention Required
            </h2>
          </div>
          
          <div className="grid gap-3">
            {expiringToday.map(renderItemCard)}
          </div>
        </div>
      )}

      {/* Expiring This Week */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold">
            Expiring This Week ({expiringWeek.filter(item => {
              const days = getDaysUntilExpiry(item.expiryDate)
              return days !== null && days > 0 && days <= 7
            }).length} items)
          </h2>
        </div>
        
        {expiringWeek.filter(item => {
          const days = getDaysUntilExpiry(item.expiryDate)
          return days !== null && days > 0 && days <= 7
        }).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No items expiring this week! 🎉</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {expiringWeek
              .filter(item => {
                const days = getDaysUntilExpiry(item.expiryDate)
                return days !== null && days > 0 && days <= 7
              })
              .map(renderItemCard)}
          </div>
        )}
      </div>

      {/* Expiring This Month (but not this week) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">
            Expiring Later This Month ({expiringMonth.length} items)
          </h2>
          <span className="text-sm text-muted-foreground">
            (8-30 days from now)
          </span>
        </div>
        
        {expiringMonth.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No items expiring later this month!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {expiringMonth.map(renderItemCard)}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {expiringToday.filter(item => getDaysUntilExpiry(item.expiryDate)! <= 0).length}
            </div>
            <div className="text-muted-foreground">Expired/Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {expiringWeek.filter(item => {
                const days = getDaysUntilExpiry(item.expiryDate)
                return days !== null && days > 0 && days <= 7
              }).length}
            </div>
            <div className="text-muted-foreground">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {expiringMonth.length}
            </div>
            <div className="text-muted-foreground">Later This Month</div>
          </div>
        </div>
      </div>
    </div>
  )
}
