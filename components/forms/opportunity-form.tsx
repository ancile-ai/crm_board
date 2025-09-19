"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, DollarSign, Building2, User, FileText, Target, Briefcase, MapPin, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CompanyForm } from "@/components/forms/company-form"

interface Company {
  id: string
  name: string
}

interface User {
  id: string
  name?: string
  email: string
}

interface Opportunity {
  id: string
  title: string
  description?: string
  stage?: string
  priority?: string
  value?: number
  closeDate?: string
  companyId?: string
  assignedToId?: string
  samGovId?: string
  naicsCode?: string
  setAsideType?: string
  contractType?: string
  placeOfPerformance?: string
}

interface OpportunityFormProps {
  opportunity?: Opportunity
  companies: Company[]
  users: User[]
  onSubmit?: (data: Opportunity) => void
  onCancel?: () => void
  hideCancelButton?: boolean
}

export function OpportunityForm({ opportunity, companies, users, onSubmit, onCancel, hideCancelButton }: OpportunityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [localCompanies, setLocalCompanies] = useState(companies)
  const [formData, setFormData] = useState({
    title: opportunity?.title || "",
    description: opportunity?.description || "",
    stage: opportunity?.stage || "LEAD",
    priority: opportunity?.priority || "MEDIUM",
    value: opportunity?.value?.toString() || "",
    closeDate: opportunity?.closeDate?.split("T")[0] || "",
    companyId: opportunity?.companyId || "",
    assignedToId: opportunity?.assignedToId || "",
    samGovId: opportunity?.samGovId || "",
    naicsCode: opportunity?.naicsCode || "",
    setAsideType: opportunity?.setAsideType,
    contractType: opportunity?.contractType || "NO_CONTRACT_TYPE",
    placeOfPerformance: opportunity?.placeOfPerformance || "",
  })



  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is changed
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleCompanyCreated = (newCompany: Company) => {
    // Update local companies list
    setLocalCompanies((prev) => [...prev, newCompany])
    // Set the newly created company as selected
    setFormData((prev) => ({ ...prev, companyId: newCompany.id }))
    // Close the modal
    setIsCompanyModalOpen(false)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) {
      newErrors.title = "Opportunity title is required"
    }
    if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters"
    }
    if (formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const url = opportunity ? `/api/opportunities/${opportunity.id}` : "/api/opportunities"

      const method = opportunity ? "PUT" : "POST"

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
          router.push("/dashboard")
          router.refresh()
        }
      } else {
        throw new Error("Failed to save opportunity")
      }
    } catch (error) {
      console.error("Error saving opportunity:", error)
      alert("Failed to save opportunity. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Basic Information Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold text-gray-900">
              Opportunity Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter opportunity title"
              className={`w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.title && <p className="text-sm text-red-600 font-medium">{errors.title}</p>}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold text-gray-900">
              Description <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the opportunity..."
              className={`w-full px-3 py-2 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-none ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-600 font-medium">{errors.description}</p>}
          </div>
        </div>

        {/* Company & Assignment Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companyId" className="text-base font-semibold text-gray-900">
              Company <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={formData.companyId} onValueChange={(value) => handleChange("companyId", value)}>
                  <SelectTrigger className="w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[200px]">
                    {localCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id} className="py-2 text-base">
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    className="h-10 w-10 px-2 border border-gray-300 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    title="Add New Company"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
                  <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                  </DialogHeader>
                  <div className="mt-6">
                    <CompanyForm
                      onSubmit={handleCompanyCreated}
                      onCancel={() => setIsCompanyModalOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToId" className="text-base font-semibold text-gray-900">
              Assigned To <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </Label>
            <Select value={formData.assignedToId} onValueChange={(value) => handleChange("assignedToId", value)}>
              <SelectTrigger className="w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="py-2 text-base">
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="stage" className="text-base font-semibold text-gray-900">
              Stage
            </Label>
            <Select value={formData.stage} onValueChange={(value) => handleChange("stage", value)}>
              <SelectTrigger className="w-full h-10 px-3 py-2 text-base justify-start border border-gray-300 rounded-lg transition-shadow hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD" className="py-2 text-base">Lead</SelectItem>
                <SelectItem value="QUALIFIED" className="py-2 text-base">Qualified</SelectItem>
                <SelectItem value="PROPOSAL" className="py-2 text-base">Proposal</SelectItem>
                <SelectItem value="NEGOTIATION" className="py-2 text-base">Negotiation</SelectItem>
                <SelectItem value="WON" className="py-2 text-base">Won</SelectItem>
                <SelectItem value="LOST" className="py-2 text-base">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-base font-semibold text-gray-900">
              Priority
            </Label>
            <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
              <SelectTrigger className="w-full h-10 px-3 py-2 text-base justify-start border border-gray-300 rounded-lg transition-shadow hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW" className="py-2 text-base">Low</SelectItem>
                <SelectItem value="MEDIUM" className="py-2 text-base">Medium</SelectItem>
                <SelectItem value="HIGH" className="py-2 text-base">High</SelectItem>
                <SelectItem value="URGENT" className="py-2 text-base">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closeDate" className="text-base font-semibold text-gray-900">
              Close Date <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </Label>
            <Input
              id="closeDate"
              type="date"
              value={formData.closeDate}
              onChange={(e) => handleChange("closeDate", e.target.value)}
              className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-lg transition-shadow hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Value Section */}
        <div className="space-y-2">
          <Label htmlFor="value" className="text-base font-semibold text-gray-900">
            Contract Value ($) <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </Label>
          <Input
            id="value"
            type="number"
            value={formData.value}
            onChange={(e) => handleChange("value", e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>

        {/* Government Contract Details */}
        <details className="px-4 py-4 border border-gray-200 rounded-lg bg-gray-50/50">
          <summary className="flex items-center gap-3 cursor-pointer select-none hover:text-blue-700 transition-colors">
            <Briefcase className="h-4 w-4 text-gray-600" />
            <span className="font-semibold text-gray-900">Government Contract Details</span>
            <span className="text-sm text-gray-500 font-normal">(Optional)</span>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="samGovId" className="text-base font-semibold text-gray-900">
                SAM.gov ID
              </Label>
              <Input
                id="samGovId"
                value={formData.samGovId}
                onChange={(e) => handleChange("samGovId", e.target.value)}
                placeholder="Enter SAM.gov opportunity ID"
                className="w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="naicsCode" className="text-base font-semibold text-gray-900">
                NAICS Code
              </Label>
              <Input
                id="naicsCode"
                value={formData.naicsCode}
                onChange={(e) => handleChange("naicsCode", e.target.value)}
                placeholder="Enter NAICS code"
                className="w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setAsideType" className="text-base font-semibold text-gray-900">
                Set-Aside Type
              </Label>
              <Select value={formData.setAsideType} onValueChange={(value) => handleChange("setAsideType", value)}>
                <SelectTrigger className="w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <SelectValue placeholder="Select set-aside type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMALL_BUSINESS" className="py-2 text-base">Small Business</SelectItem>
                  <SelectItem value="EIGHT_A" className="py-2 text-base">8(a) Business Development</SelectItem>
                  <SelectItem value="HUBZONE" className="py-2 text-base">HUBZone</SelectItem>
                  <SelectItem value="WOSB" className="py-2 text-base">Women-Owned Small Business</SelectItem>
                  <SelectItem value="VOSB" className="py-2 text-base">Veteran-Owned Small Business</SelectItem>
                  <SelectItem value="SDVOSB" className="py-2 text-base">Service-Disabled Veteran-Owned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType" className="text-base font-semibold text-gray-900">
                Contract Type
              </Label>
              <Select value={formData.contractType} onValueChange={(value) => handleChange("contractType", value)}>
                <SelectTrigger className="w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_CONTRACT_TYPE" className="py-2 text-base">No Contract Type</SelectItem>
                  <SelectItem value="FIXED_PRICE" className="py-2 text-base">Fixed Price</SelectItem>
                  <SelectItem value="COST_PLUS" className="py-2 text-base">Cost Plus</SelectItem>
                  <SelectItem value="TIME_AND_MATERIALS" className="py-2 text-base">Time & Materials</SelectItem>
                  <SelectItem value="INDEFINITE_DELIVERY" className="py-2 text-base">Indefinite Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="placeOfPerformance" className="text-base font-semibold text-gray-900">
                Place of Performance
              </Label>
              <Input
                id="placeOfPerformance"
                value={formData.placeOfPerformance}
                onChange={(e) => handleChange("placeOfPerformance", e.target.value)}
                placeholder="Enter place of performance"
                className="w-full h-10 px-3 text-base border-gray-300 rounded-lg transition-shadow focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
        </details>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100">
          {!hideCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => router.back())}
              disabled={loading}
              className="sm:w-auto px-6 py-2 border-gray-300 hover:bg-gray-50 hover:border-blue-400 transition-colors"
            >
              Cancel
            </Button>
          )}
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
              opportunity ? "Update Opportunity" : "Create Opportunity"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
