"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Calendar, DollarSign, FileText, Download } from "lucide-react"

interface OpportunityResultsProps {
  opportunities: any[]
  onImport: (opportunities: any[]) => void
  importing: boolean
}

export function OpportunityResults({ opportunities, onImport, importing }: OpportunityResultsProps) {
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOpportunities(opportunities.map((opp) => opp.noticeId))
    } else {
      setSelectedOpportunities([])
    }
  }

  const handleSelectOpportunity = (noticeId: string, checked: boolean) => {
    if (checked) {
      setSelectedOpportunities((prev) => [...prev, noticeId])
    } else {
      setSelectedOpportunities((prev) => prev.filter((id) => id !== noticeId))
    }
  }

  const handleImport = () => {
    const selectedOpps = opportunities.filter((opp) => selectedOpportunities.includes(opp.noticeId))
    onImport(selectedOpps)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatAmount = (amount: string) => {
    if (!amount) return "N/A"
    return amount.replace(/\$/, "$").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No opportunities found. Try adjusting your search criteria.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Search Results ({opportunities.length})
          </CardTitle>
          <Button onClick={handleImport} disabled={selectedOpportunities.length === 0 || importing}>
            <Download className="h-4 w-4 mr-2" />
            {importing ? "Importing..." : `Import Selected (${selectedOpportunities.length})`}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedOpportunities.length === opportunities.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Set-Aside</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Response Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.noticeId}>
                <TableCell>
                  <Checkbox
                    checked={selectedOpportunities.includes(opp.noticeId)}
                    onCheckedChange={(checked) => handleSelectOpportunity(opp.noticeId, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{opp.title}</div>
                    <div className="text-sm text-muted-foreground">{opp.solicitationNumber}</div>
                    <div className="text-xs text-muted-foreground">NAICS: {opp.naicsCode}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Building2 className="h-3 w-3" />
                      {opp.department}
                    </div>
                    <div className="text-xs text-muted-foreground">{opp.office}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{opp.typeOfSetAsideDescription || "No Set-Aside"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="h-3 w-3" />
                    {formatAmount(opp.award?.amount)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDate(opp.responseDeadLine)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
