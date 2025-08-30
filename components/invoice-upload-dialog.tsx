"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  File,
  X,
  Edit3,
  Plus,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react'

interface InvoiceItem {
  id: string
  name: string
  brand?: string
  quantity: number
  unit: string
  price?: number
  category?: string
  location?: string
  notes?: string
  status?: string
  selected: boolean
  isEditing?: boolean
}

interface InvoiceUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kitchenId: number
  categories: any[]
  onSuccess: () => void
}

export default function InvoiceUploadDialog({
  open,
  onOpenChange,
  kitchenId,
  categories,
  onSuccess
}: InvoiceUploadDialogProps) {
  const [step, setStep] = useState<'upload' | 'review' | 'adding'>('upload')
  const [uploadMethod, setUploadMethod] = useState<'pdf' | 'text'>('pdf')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [invoiceText, setInvoiceText] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [showExtractedText, setShowExtractedText] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handlePdfUpload = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('pdfFile', selectedFile)
      formData.append('kitchenId', kitchenId.toString())

      const response = await fetch('/api/ingredients/invoice-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        const itemsWithSelection = data.items.map((item: any, index: number) => ({
          ...item,
          id: `item-${index}`,
          selected: true,
          isEditing: false
        }))
        setItems(itemsWithSelection)
        setExtractedText(data.extractedText || '')
        setStep('review')
      } else {
        setError(data.error || 'Failed to process PDF')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!invoiceText.trim()) {
      setError('Please paste your invoice text')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/ingredients/invoice-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceText: invoiceText.trim(),
          kitchenId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const itemsWithSelection = data.items.map((item: any, index: number) => ({
          ...item,
          id: `item-${index}`,
          selected: true,
          isEditing: false
        }))
        setItems(itemsWithSelection)
        setStep('review')
      } else {
        setError(data.error || 'Failed to process invoice')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmItems = async () => {
    const selectedItems = items.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      setError('Please select at least one item to add')
      return
    }

    setStep('adding')
    setError('')

    try {
      const response = await fetch('/api/ingredients/invoice-upload', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: selectedItems,
          kitchenId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        handleClose()
      } else {
        setError(data.error || 'Failed to add items')
        setStep('review')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      setStep('review')
    }
  }

  // Table editing functions
  const toggleItemSelection = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ))
  }

  const toggleAllSelection = () => {
    const allSelected = items.every(item => item.selected)
    setItems(prev => prev.map(item => ({ ...item, selected: !allSelected })))
  }

  const updateItemField = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const toggleItemEditing = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isEditing: !item.isEditing } : item
    ))
  }

  const addNewItem = () => {
    const newItem: InvoiceItem = {
      id: `new-${Date.now()}`,
      name: '',
      brand: '',
      quantity: 1,
      unit: 'pcs',
      category: '',
      location: 'Pantry',
      notes: '',
      status: 'Fresh',
      selected: true,
      isEditing: true
    }
    setItems(prev => [...prev, newItem])
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const duplicateItem = (id: string) => {
    const itemToDuplicate = items.find(item => item.id === id)
    if (itemToDuplicate) {
      const duplicatedItem = {
        ...itemToDuplicate,
        id: `dup-${Date.now()}`,
        isEditing: false
      }
      setItems(prev => [...prev, duplicatedItem])
    }
  }

  const getCategoryName = (categoryName: string | null | undefined) => {
    return categoryName || 'Uncategorized'
  }

  const handleClose = () => {
    setStep('upload')
    setUploadMethod('pdf')
    setSelectedFile(null)
    setInvoiceText('')
    setItems([])
    setError('')
    setExtractedText('')
    setShowExtractedText(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  const selectedCount = items.filter(item => item.selected).length
  const totalValue = items
    .filter(item => item.selected && item.price)
    .reduce((sum, item) => sum + (item.price || 0), 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Items from PDF Invoice
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && "Upload any grocery PDF invoice - our AI will extract ingredients automatically"}
            {step === 'review' && `AI extracted ${items.length} items - review and edit before adding (${selectedCount} selected)`}
            {step === 'adding' && "Adding items to your kitchen..."}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Upload Method Toggle */}
            <div className="flex rounded-lg border p-1">
              <button
                onClick={() => setUploadMethod('pdf')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'pdf' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <File className="h-4 w-4 mr-2 inline" />
                Upload PDF
              </button>
              <button
                onClick={() => setUploadMethod('text')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'text' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4 mr-2 inline" />
                Paste Text
              </button>
            </div>

            {/* PDF Upload */}
            {uploadMethod === 'pdf' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Upload PDF Invoice</p>
                    <p className="text-sm text-muted-foreground">
                      Select any PDF invoice from grocery services - our AI will automatically extract all ingredients
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mx-auto"
                  >
                    <File className="h-4 w-4 mr-2" />
                    Choose PDF File
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 10MB
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <File className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Text Input */}
            {uploadMethod === 'text' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invoice-text">Invoice Text</Label>
                  <Textarea
                    id="invoice-text"
                    placeholder="Paste your invoice text here...

Example:
Onions | 1kg | ₹25
Tomatoes | 500g | ₹30
Milk (Amul) | 1l | ₹65
Bread (Britannia) | 1 pack | ₹35"
                    value={invoiceText}
                    onChange={(e) => setInvoiceText(e.target.value)}
                    rows={8}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Review Step - Editable Table */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedCount} of {items.length} items selected
                </span>
                {totalValue > 0 && (
                  <Badge variant="outline">
                    Total: ₹{totalValue.toFixed(2)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtractedText(!showExtractedText)}
                >
                  {showExtractedText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showExtractedText ? 'Hide' : 'Show'} Extracted Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addNewItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllSelection}
                >
                  {items.every(item => item.selected) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            {/* Extracted Text Preview */}
            {showExtractedText && extractedText && (
              <div className="border rounded-lg p-3">
                <h4 className="font-medium mb-2">Extracted Text:</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32 whitespace-pre-wrap">
                  {extractedText}
                </pre>
              </div>
            )}

            {/* Editable Items Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={items.length > 0 && items.every(item => item.selected)}
                        onCheckedChange={toggleAllSelection}
                      />
                    </TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className={item.selected ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                      </TableCell>
                      
                      {/* Item Name */}
                      <TableCell>
                        {item.isEditing ? (
                          <Input
                            value={item.name}
                            onChange={(e) => updateItemField(item.id, 'name', e.target.value)}
                            placeholder="Item name"
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{item.name || 'Unnamed Item'}</span>
                        )}
                      </TableCell>
                      
                      {/* Brand */}
                      <TableCell>
                        {item.isEditing ? (
                          <Input
                            value={item.brand || ''}
                            onChange={(e) => updateItemField(item.id, 'brand', e.target.value)}
                            placeholder="Brand"
                            className="h-8"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {item.brand || '-'}
                          </span>
                        )}
                      </TableCell>
                      
                      {/* Quantity */}
                      <TableCell>
                        {item.isEditing ? (
                          <Input
                            type="number"
                            min="1"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => updateItemField(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                            className="h-8 w-20"
                          />
                        ) : (
                          <span>{item.quantity}</span>
                        )}
                      </TableCell>
                      
                      {/* Unit */}
                      <TableCell>
                        {item.isEditing ? (
                          <select
                            value={item.unit}
                            onChange={(e) => updateItemField(item.id, 'unit', e.target.value)}
                            className="h-8 px-2 border border-input rounded text-sm"
                          >
                            <option value="pcs">pcs</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="l">l</option>
                            <option value="ml">ml</option>
                            <option value="pack">pack</option>
                            <option value="bottle">bottle</option>
                            <option value="can">can</option>
                            <option value="box">box</option>
                          </select>
                        ) : (
                          <span>{item.unit}</span>
                        )}
                      </TableCell>
                      
                      {/* Category */}
                      <TableCell>
                        {item.isEditing ? (
                          <select
                            value={item.category || ''}
                            onChange={(e) => updateItemField(item.id, 'category', e.target.value || null)}
                            className="h-8 px-2 border border-input rounded text-sm"
                          >
                            <option value="">Uncategorized</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(item.category)}
                          </Badge>
                        )}
                      </TableCell>
                      
                      {/* Location */}
                      <TableCell>
                        {item.isEditing ? (
                          <select
                            value={item.location || 'Pantry'}
                            onChange={(e) => updateItemField(item.id, 'location', e.target.value)}
                            className="h-8 px-2 border border-input rounded text-sm"
                          >
                            <option value="Pantry">Pantry</option>
                            <option value="Fridge">Fridge</option>
                            <option value="Freezer">Freezer</option>
                          </select>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {item.location || 'Pantry'}
                          </span>
                        )}
                      </TableCell>
                      
                      {/* Notes */}
                      <TableCell>
                        {item.isEditing ? (
                          <Input
                            value={item.notes || ''}
                            onChange={(e) => updateItemField(item.id, 'notes', e.target.value)}
                            placeholder="Notes..."
                            className="h-8"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {item.notes ? item.notes.substring(0, 20) + (item.notes.length > 20 ? '...' : '') : '-'}
                          </span>
                        )}
                      </TableCell>
                      

                      
                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemEditing(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateItem(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No items found. Try adding items manually.</p>
                <Button onClick={addNewItem} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Adding Step */}
        {step === 'adding' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Adding {selectedCount} items to your kitchen...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {uploadMethod === 'pdf' ? (
                <Button onClick={handlePdfUpload} disabled={!selectedFile || isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Extract with AI
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleTextSubmit} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Extract with AI
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={addNewItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button 
                  onClick={handleConfirmItems} 
                  disabled={selectedCount === 0}
                  className="min-w-32"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add {selectedCount} Items
                  {totalValue > 0 && (
                    <span className="ml-2 text-xs opacity-75">
                      (₹{totalValue.toFixed(0)})
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
