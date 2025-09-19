"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Building2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Company {
  id: string
  name: string
}

interface SearchableCompanySelectProps {
  value?: string
  companies: Company[]
  onValueChange: (value: string) => void
  onCompanyCreated?: (company: Company) => void
  placeholder?: string
  className?: string
}

export function SearchableCompanySelect({
  value,
  companies,
  onValueChange,
  onCompanyCreated,
  placeholder = "Select a company",
  className,
}: SearchableCompanySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: "",
    website: "",
    email: "",
  })
  const [creatingCompany, setCreatingCompany] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedCompany = companies.find((company) => company.id === value)

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (company: Company) => {
    onValueChange(company.id)
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false)
      setSearchTerm("")
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleCreateCompany = async () => {
    if (!createFormData.name.trim()) return

    setCreatingCompany(true)
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFormData),
      })

      if (response.ok) {
        const newCompany = await response.json()
        if (onCompanyCreated) {
          onCompanyCreated(newCompany)
        }
        onValueChange(newCompany.id)
        setCreateFormData({ name: "", website: "", email: "" })
        setShowCreateForm(false)
        setIsOpen(false)
        setSearchTerm("")
      } else {
        throw new Error("Failed to create company")
      }
    } catch (error) {
      console.error("Error creating company:", error)
      alert("Failed to create company. Please try again.")
    } finally {
      setCreatingCompany(false)
    }
  }

  const handleShowCreateForm = () => {
    setCreateFormData((prev) => ({ ...prev, name: searchTerm }))
    setShowCreateForm(true)
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setCreateFormData({ name: "", website: "", email: "" })
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-base transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className="truncate">
          {selectedCompany?.name || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {showCreateForm ? (
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Add New Company</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="create-name" className="text-xs text-gray-600">Name *</Label>
                    <Input
                      id="create-name"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Company name"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-website" className="text-xs text-gray-600">Website</Label>
                    <Input
                      id="create-website"
                      type="url"
                      value={createFormData.website}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-email" className="text-xs text-gray-600">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@company.com"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCancelCreate}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateCompany}
                    disabled={creatingCompany || !createFormData.name.trim()}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    {creatingCompany ? (
                      <>
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full mr-1 animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </div>
            ) : filteredCompanies.length > 0 ? (
              <>
                {filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelect(company)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  >
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="flex-1 truncate">{company.name}</span>
                    {value === company.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-200"></div>
                <button
                  type="button"
                  onClick={handleShowCreateForm}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Company</span>
                </button>
              </>
            ) : searchTerm.trim() ? (
              <>
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No companies found for "{searchTerm}"
                </div>
                <div className="border-t border-gray-200"></div>
                <button
                  type="button"
                  onClick={handleShowCreateForm}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add "{searchTerm}" as new company</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleShowCreateForm}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-blue-600"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Company</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
