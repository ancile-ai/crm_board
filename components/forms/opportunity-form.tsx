"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, DollarSign, Building2, User } from "lucide-react"

interface OpportunityFormProps {
  opportunity?: any
  companies: any[]
  users: any[]
  onSubmit?: (data: any) => void
  onCancel?: () => void
}

export function OpportunityForm({ opportunity, companies, users, onSubmit, onCancel }: OpportunityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    setAsideType: opportunity?.setAsideType || "NO_SET_ASIDE",
    contractType: opportunity?.contractType || "NO_CONTRACT_TYPE",
    placeOfPerformance: opportunity?.placeOfPerformance || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {opportunity ? "Edit Opportunity" : "Create New Opportunity"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Opportunity Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Enter opportunity title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter opportunity description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => handleChange("stage", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="PROPOSAL">Proposal</SelectItem>
                      <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                      <SelectItem value="WON">Won</SelectItem>
                      <SelectItem value="LOST">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Financial & Assignment */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="value" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Contract Value
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleChange("value", e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="closeDate" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Close Date
                </Label>
                <Input
                  id="closeDate"
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) => handleChange("closeDate", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="companyId">Company</Label>
                <Select value={formData.companyId} onValueChange={(value) => handleChange("companyId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignedToId" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned To
                </Label>
                <Select value={formData.assignedToId} onValueChange={(value) => handleChange("assignedToId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Government Contract Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Government Contract Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="samGovId">SAM.gov ID</Label>
                <Input
                  id="samGovId"
                  value={formData.samGovId}
                  onChange={(e) => handleChange("samGovId", e.target.value)}
                  placeholder="Enter SAM.gov opportunity ID"
                />
              </div>

              <div>
                <Label htmlFor="naicsCode">NAICS Code</Label>
                <Input
                  id="naicsCode"
                  value={formData.naicsCode}
                  onChange={(e) => handleChange("naicsCode", e.target.value)}
                  placeholder="Enter NAICS code"
                />
              </div>

              <div>
                <Label htmlFor="setAsideType">Set-Aside Type</Label>
                <Select value={formData.setAsideType} onValueChange={(value) => handleChange("setAsideType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select set-aside type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO_SET_ASIDE">No Set-Aside</SelectItem>
                    <SelectItem value="SMALL_BUSINESS">Small Business</SelectItem>
                    <SelectItem value="WOMAN_OWNED">Woman-Owned Small Business</SelectItem>
                    <SelectItem value="VETERAN_OWNED">Veteran-Owned Small Business</SelectItem>
                    <SelectItem value="SERVICE_DISABLED_VETERAN">Service-Disabled Veteran-Owned</SelectItem>
                    <SelectItem value="HUBZONE">HUBZone</SelectItem>
                    <SelectItem value="8A">8(a) Business Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contractType">Contract Type</Label>
                <Select value={formData.contractType} onValueChange={(value) => handleChange("contractType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO_CONTRACT_TYPE">No Contract Type</SelectItem>
                    <SelectItem value="FIXED_PRICE">Fixed Price</SelectItem>
                    <SelectItem value="COST_PLUS">Cost Plus</SelectItem>
                    <SelectItem value="TIME_AND_MATERIALS">Time & Materials</SelectItem>
                    <SelectItem value="INDEFINITE_DELIVERY">Indefinite Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="placeOfPerformance">Place of Performance</Label>
                <Input
                  id="placeOfPerformance"
                  value={formData.placeOfPerformance}
                  onChange={(e) => handleChange("placeOfPerformance", e.target.value)}
                  placeholder="Enter place of performance"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel || (() => router.back())} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : opportunity ? "Update Opportunity" : "Create Opportunity"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
