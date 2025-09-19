"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CompanyForm } from "@/components/forms/company-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, Plus, Search, Globe, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)

  useEffect(() => {
    fetchCompanies()
  }, [searchTerm])

  const fetchCompanies = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/companies?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (company: any) => {
    setSelectedCompany(company)
    setShowForm(true)
  }

  const handleDelete = async (companyId: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      try {
        const response = await fetch(`/api/companies/${companyId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          fetchCompanies()
        }
      } catch (error) {
        console.error("Error deleting company:", error)
      }
    }
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    setSelectedCompany(null)
    fetchCompanies()
  }

  const getCertificationBadges = (company: any) => {
    const badges = []
    if (company.samRegistered) badges.push("SAM")
    if (company.smallBusiness) badges.push("SB")
    if (company.womanOwned) badges.push("WOSB")
    if (company.veteranOwned) badges.push("VOSB")
    if (company.hubzone) badges.push("HUBZone")
    if (company.eightA) badges.push("8(a)")
    return badges
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage your company database and government contractor information</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, industry, or CAGE code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies ({companies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading companies...</div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No companies found. Add your first company to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Certifications</TableHead>
                  <TableHead>Opportunities</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company: any) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.website && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{company.industry || "N/A"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {company.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {company.phone}
                          </div>
                        )}
                        {company.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {company.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.city && company.state ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {company.city}, {company.state}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getCertificationBadges(company).map((badge) => (
                          <Badge key={badge} variant="secondary" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{company._count.opportunities} opportunities</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(company.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Company Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
          </DialogHeader>
          <CompanyForm
            company={selectedCompany}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false)
              setSelectedCompany(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
