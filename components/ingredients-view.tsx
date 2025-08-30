"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock,
  MapPin,
  Calendar,
  Minus,
  MoreVertical,
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AddIngredientDialog from './add-ingredient-dialog'
import InvoiceUploadDialog from './invoice-upload-dialog'

interface Ingredient {
  id: number
  name: string
  brand?: string | null
  quantity: number
  unit?: string | null
  status: "Fresh" | "Expiring" | "Expired" | null
  expiryDate?: string | null
  location?: string | null
  notes?: string | null
  category?: string | null
  categoryColor?: string | null
  createdAt: Date
}

interface Category {
  id: number
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
}

interface IngredientsViewProps {
  ingredients: Ingredient[]
  categories: Category[]
  kitchenId: number
  stats: {
    totalItems: number
    expiringCount: number
    expiredCount: number
  }
}

export default function IngredientsView({ 
  ingredients, 
  categories, 
  kitchenId,
  stats 
}: IngredientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showInvoiceUpload, setShowInvoiceUpload] = useState(false)

  // Filter ingredients
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ingredient.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory
    const matchesStatus = statusFilter === 'all' || ingredient.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Get status badge color
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Fresh': return 'bg-green-100 text-green-800 border-green-200'
      case 'Expiring': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Expired': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Note: formatDate is now imported from utils

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900 font-medium">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalItems}</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-900 font-medium">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.expiringCount}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-900 font-medium">Expired</span>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-1">{stats.expiredCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="Fresh">Fresh</option>
            <option value="Expiring">Expiring</option>
            <option value="Expired">Expired</option>
          </select>

          <Button 
            variant="outline"
            onClick={() => setShowInvoiceUpload(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Add from Invoice
          </Button>
          
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Ingredients Grid */}
      {filteredIngredients.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {ingredients.length === 0 ? "No ingredients yet" : "No ingredients found"}
          </h3>
          <p className="text-gray-500 mb-4">
            {ingredients.length === 0 
              ? "Start by adding your first ingredient to track it in your kitchen."
              : "Try adjusting your search or filters."}
          </p>
          {ingredients.length === 0 && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Ingredient
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIngredients.map((ingredient) => {
            const daysUntilExpiry = getDaysUntilExpiry(ingredient.expiryDate)
            
            return (
              <div key={ingredient.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{ingredient.name}</h3>
                    {ingredient.brand && (
                      <p className="text-sm text-muted-foreground">{ingredient.brand}</p>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Update Quantity</DropdownMenuItem>
                      <DropdownMenuItem>Mark as Consumed</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {ingredient.quantity} 
                    {ingredient.unit && (
                      <span className="text-base font-normal text-muted-foreground ml-1">
                        {ingredient.unit}
                      </span>
                    )}
                  </div>
                  
                  {ingredient.status && (
                    <Badge className={getStatusColor(ingredient.status)}>
                      {ingredient.status}
                    </Badge>
                  )}
                </div>

                {ingredient.category && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ingredient.category}</Badge>
                  </div>
                )}

                <div className="space-y-1 text-sm text-muted-foreground">
                  {ingredient.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{ingredient.location}</span>
                    </div>
                  )}
                  
                  {ingredient.expiryDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Expires {formatDate(ingredient.expiryDate)}
                        {daysUntilExpiry !== null && (
                          <span className={`ml-1 ${
                            daysUntilExpiry < 0 ? 'text-red-600' : 
                            daysUntilExpiry <= 3 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            ({daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)} days ago` : 
                              daysUntilExpiry === 0 ? 'today' : 
                              `${daysUntilExpiry} days`})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {ingredient.notes && (
                  <p className="text-sm text-muted-foreground italic">
                    {ingredient.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Ingredient Dialog */}
      <AddIngredientDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        kitchenId={kitchenId}
        categories={categories}
        onSuccess={() => {
          setShowAddDialog(false)
          // Refresh the page to show new ingredient
          window.location.reload()
        }}
      />

      {/* Invoice Upload Dialog */}
      <InvoiceUploadDialog 
        open={showInvoiceUpload}
        onOpenChange={setShowInvoiceUpload}
        kitchenId={kitchenId}
        categories={categories}
        onSuccess={() => {
          setShowInvoiceUpload(false)
          // Refresh the page to show new ingredients
          window.location.reload()
        }}
      />
    </div>
  )
}
