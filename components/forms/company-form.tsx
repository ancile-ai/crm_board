"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Globe, Phone, Mail, MapPin } from "lucide-react"

interface CompanyFormProps {
  company?: any
  onSubmit?: (data: any) => void
  onCancel?: () => void
}

export function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: company?.name || "",
    industry: company?.industry || "",
    website: company?.website || "",
    phone: company?.phone || "",
    email: company?.email || "",
    address: company?.address || "",
    city: company?.city || "",
    state: company?.state || "",
    zipCode: company?.zipCode || "",
    country: company?.country || "USA",
    cageCode: company?.cageCode || "",
    duns: company?.duns || "",
    samRegistered: company?.samRegistered || false,
    smallBusiness: company?.smallBusiness || false,
    womanOwned: company?.womanOwned || false,
    veteranOwned: company?.veteranOwned || false,
    hubzone: company?.hubzone || false,
    eightA: company?.eightA || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = company ? `/api/companies/${company.id}` : "/api/companies"
      const method = company ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        if (onSubmit) {
          onSubmit(result)
        } else {
          router.push("/dashboard/companies")
          router.refresh()
        }
      } else {
        throw new Error("Failed to save company")
      }
    } catch (error) {
      console.error("Error saving company:", error)
      alert("Failed to save company. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {company ? "Edit Company" : "Add New Company"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  placeholder="e.g., Information Technology"
                />
              </div>

              <div>
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleChange("zipCode", e.target.value)}
                    placeholder="12345"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    placeholder="USA"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Government Registration */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Government Registration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="cageCode">CAGE Code</Label>
                <Input
                  id="cageCode"
                  value={formData.cageCode}
                  onChange={(e) => handleChange("cageCode", e.target.value)}
                  placeholder="Enter CAGE code"
                />
              </div>

              <div>
                <Label htmlFor="duns">DUNS Number</Label>
                <Input
                  id="duns"
                  value={formData.duns}
                  onChange={(e) => handleChange("duns", e.target.value)}
                  placeholder="Enter DUNS number"
                />
              </div>
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <h4 className="font-medium">Certifications & Set-Asides</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="samRegistered"
                    checked={formData.samRegistered}
                    onCheckedChange={(checked) => handleChange("samRegistered", checked)}
                  />
                  <Label htmlFor="samRegistered">SAM Registered</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smallBusiness"
                    checked={formData.smallBusiness}
                    onCheckedChange={(checked) => handleChange("smallBusiness", checked)}
                  />
                  <Label htmlFor="smallBusiness">Small Business</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="womanOwned"
                    checked={formData.womanOwned}
                    onCheckedChange={(checked) => handleChange("womanOwned", checked)}
                  />
                  <Label htmlFor="womanOwned">Woman-Owned</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="veteranOwned"
                    checked={formData.veteranOwned}
                    onCheckedChange={(checked) => handleChange("veteranOwned", checked)}
                  />
                  <Label htmlFor="veteranOwned">Veteran-Owned</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hubzone"
                    checked={formData.hubzone}
                    onCheckedChange={(checked) => handleChange("hubzone", checked)}
                  />
                  <Label htmlFor="hubzone">HUBZone</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="eightA"
                    checked={formData.eightA}
                    onCheckedChange={(checked) => handleChange("eightA", checked)}
                  />
                  <Label htmlFor="eightA">8(a) Certified</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel || (() => router.back())} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : company ? "Update Company" : "Create Company"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
