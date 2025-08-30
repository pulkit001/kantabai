"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showQuantityDialog, setShowQuantityDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [newQuantity, setNewQuantity] = useState(1)
  const [editForm, setEditForm] = useState({
    name: '',
    brand: '',
    quantity: 1,
    unit: '',
    categoryId: null as number | null,
    location: '',
    purchaseDate: '',
    expiryDate: '',
    notes: '',
    barcode: ''
  })
  const [isLoading, setIsLoading] = useState(false)

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

  // Handle edit ingredient
  const handleEdit = (ingredient: Ingredient) => {
    console.log('Edit clicked for:', ingredient.name)
    setSelectedIngredient(ingredient)
    
    // Find category ID from categories array
    const categoryId = categories.find(cat => cat.name === ingredient.category)?.id || null
    
    setEditForm({
      name: ingredient.name,
      brand: ingredient.brand || '',
      quantity: ingredient.quantity,
      unit: ingredient.unit || '',
      categoryId,
      location: ingredient.location || '',
      purchaseDate: '',
      expiryDate: ingredient.expiryDate || '',
      notes: ingredient.notes || '',
      barcode: ''
    })
    
    setShowEditDialog(true)
  }

  // Handle update quantity
  const handleUpdateQuantity = (ingredient: Ingredient) => {
    console.log('Update quantity clicked for:', ingredient.name)
    setSelectedIngredient(ingredient)
    setNewQuantity(ingredient.quantity)
    setShowQuantityDialog(true)
  }

  
  // Handle delete ingredient
  const handleDelete = async (ingredient: Ingredient) => {
    console.log('Delete clicked for:', ingredient.name)
    setSelectedIngredient(ingredient)
    setShowDeleteDialog(true)
  }

  // Confirm delete ingredient
  const confirmDelete = async () => {
    if (!selectedIngredient) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ingredients/${selectedIngredient.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShowDeleteDialog(false)
        setSelectedIngredient(null)
        window.location.reload() // Refresh to show updated data
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle quantity update submit
  const handleQuantitySubmit = async () => {
    if (!selectedIngredient) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ingredients/${selectedIngredient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateQuantity',
          quantity: newQuantity
        }),
      })

      if (response.ok) {
        setShowQuantityDialog(false)
        setSelectedIngredient(null)
        window.location.reload() // Refresh to show updated data
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!selectedIngredient) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ingredients/${selectedIngredient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateItem',
          itemData: {
            name: editForm.name,
            brand: editForm.brand || null,
            quantity: editForm.quantity,
            unit: editForm.unit || null,
            categoryId: editForm.categoryId,
            location: editForm.location || null,
            notes: editForm.notes || null,
          }
        }),
      })

      if (response.ok) {
        setShowEditDialog(false)
        setSelectedIngredient(null)
        window.location.reload() // Refresh to show updated data
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
                      <DropdownMenuItem 
                        onSelect={(e) => {
                          e.preventDefault()
                          handleEdit(ingredient)
                        }}
                        disabled={isLoading}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={(e) => {
                          e.preventDefault()
                          handleUpdateQuantity(ingredient)
                        }}
                        disabled={isLoading}
                      >
                        Update Quantity
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onSelect={(e) => {
                          e.preventDefault()
                          handleDelete(ingredient)
                        }}
                        disabled={isLoading}
                      >
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ingredient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedIngredient?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Quantity Dialog */}
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quantity</DialogTitle>
            <DialogDescription>
              Update the quantity for {selectedIngredient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">New Quantity</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIngredient?.unit || 'units'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuantityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuantitySubmit} disabled={isLoading}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
            <DialogDescription>
              Edit details for {selectedIngredient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Ingredient name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={editForm.brand}
                onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                placeholder="Brand name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-quantity">Quantity *</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit</Label>
                <Input
                  id="edit-unit"
                  value={editForm.unit}
                  onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                  placeholder="kg, g, l, pcs"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <select
                id="edit-category"
                value={editForm.categoryId || ''}
                onChange={(e) => setEditForm({...editForm, categoryId: e.target.value ? parseInt(e.target.value) : null})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="edit-location">Storage Location</Label>
              <select
                id="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select location</option>
                <option value="Pantry">Pantry</option>
                <option value="Fridge">Fridge</option>
                <option value="Freezer">Freezer</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="edit-expiry">Expiry Date</Label>
              <Input
                id="edit-expiry"
                type="date"
                value={editForm.expiryDate}
                onChange={(e) => setEditForm({...editForm, expiryDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({...editForm, notes: e.target.value})}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
