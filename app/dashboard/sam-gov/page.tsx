"use client"

import { useState } from "react"
import { OpportunitySearch } from "@/components/sam-gov/opportunity-search"
import { OpportunityResults } from "@/components/sam-gov/opportunity-results"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Globe } from "lucide-react"

export default function SamGovPage() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSearch = async (params: any) => {
    setLoading(true)
    setMessage(null)

    try {
      const searchParams = new URLSearchParams(params)
      const response = await fetch(`/api/sam-gov/opportunities?${searchParams}`)

      if (response.ok) {
        const data = await response.json()
        setOpportunities(data.opportunitiesData || [])

        if (data.error) {
          setMessage({ type: "error", text: data.error })
        }
      } else {
        throw new Error("Failed to fetch opportunities")
      }
    } catch (error) {
      console.error("Error searching opportunities:", error)
      setMessage({ type: "error", text: "Failed to search opportunities. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (selectedOpportunities: any[]) => {
    setImporting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/sam-gov/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunities: selectedOpportunities }),
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({
          type: "success",
          text: `Successfully imported ${result.imported} of ${result.total} opportunities`,
        })

        // Clear selection after successful import
        setOpportunities([])
      } else {
        throw new Error("Failed to import opportunities")
      }
    } catch (error) {
      console.error("Error importing opportunities:", error)
      setMessage({ type: "error", text: "Failed to import opportunities. Please try again." })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SAM.gov Integration</h1>
          <p className="text-muted-foreground">Search and import federal contracting opportunities from SAM.gov</p>
        </div>
      </div>

      {/* API Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            <span>Connected to SAM.gov API</span>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Search Form */}
      <OpportunitySearch onSearch={handleSearch} loading={loading} />

      {/* Results */}
      {opportunities.length > 0 && (
        <OpportunityResults opportunities={opportunities} onImport={handleImport} importing={importing} />
      )}
    </div>
  )
}
