"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Globe, Mail } from "lucide-react"

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
    website: company?.website || "",
    email: company?.email || "",
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
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Building2 className="h-5 w-5" />
            {company ? "Edit Company" : "Add New Company"}
          </div>
        </div>

        {/* Company Fields */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold text-gray-900">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter company name"
              className={`w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder="https://example.com"
              className={`w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="contact@company.com"
              className={`w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white`}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
            disabled={loading}
            className="sm:w-auto px-6 py-2 border-gray-300 hover:bg-gray-50 hover:border-blue-400 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2 animate-spin inline-block"></div>
                Saving...
              </>
            ) : (
              company ? "Update Company" : "Create Company"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
