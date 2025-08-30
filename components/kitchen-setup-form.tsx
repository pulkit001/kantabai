"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChefHat, Loader2 } from 'lucide-react'

interface KitchenSetupFormProps {
  userId: string
  userEmail: string
}

export default function KitchenSetupForm({ userId, userEmail }: KitchenSetupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: 'My Kitchen',
    location: '',
    description: ''
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/kitchens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
          isDefault: true,
        }),
      })

      if (response.ok) {
        const kitchen = await response.json()
        router.push(`/dashboard`)
      } else {
        console.error('Failed to create kitchen')
      }
    } catch (error) {
      console.error('Error creating kitchen:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-base font-medium">
              Kitchen Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., My Kitchen, Home Kitchen, Office Pantry"
              required
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Give your kitchen a name to identify it easily
            </p>
          </div>

          <div>
            <Label htmlFor="location" className="text-base font-medium">
              Location
            </Label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Home, Office, Apartment 2B"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Where is this kitchen located?
            </p>
          </div>

          <div>
            <Label htmlFor="description" className="text-base font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about your kitchen setup, cooking style, or any special notes..."
              rows={3}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Optional: Add any details about your kitchen
            </p>
          </div>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            What&apos;s Next?
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            After creating your kitchen, you&apos;ll be able to:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Add ingredients with expiry dates</li>
            <li>• Track quantities and locations</li>
            <li>• Get expiry alerts</li>
            <li>• Create recipes and shopping lists</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button 
            type="submit" 
            disabled={isLoading || !formData.name.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ChefHat className="h-4 w-4 mr-2" />
                Create Kitchen
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
