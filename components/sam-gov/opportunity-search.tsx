"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

interface OpportunitySearchProps {
  onSearch: (params: any) => void
  loading: boolean
}

export function OpportunitySearch({ onSearch, loading }: OpportunitySearchProps) {
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    naicsCode: "",
    setAside: "All Set-Asides",
    limit: "50",
  })

  const handleSearch = () => {
    onSearch(searchParams)
  }

  const handleChange = (field: string, value: string) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search SAM.gov Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="keyword">Keyword</Label>
            <Input
              id="keyword"
              value={searchParams.keyword}
              onChange={(e) => handleChange("keyword", e.target.value)}
              placeholder="e.g., IT services, engineering"
            />
          </div>

          <div>
            <Label htmlFor="naicsCode">NAICS Code</Label>
            <Input
              id="naicsCode"
              value={searchParams.naicsCode}
              onChange={(e) => handleChange("naicsCode", e.target.value)}
              placeholder="e.g., 541512"
            />
          </div>

          <div>
            <Label htmlFor="setAside">Set-Aside Type</Label>
            <Select value={searchParams.setAside} onValueChange={(value) => handleChange("setAside", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All set-asides" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Set-Asides">All Set-Asides</SelectItem>
                <SelectItem value="SBA">Small Business</SelectItem>
                <SelectItem value="WOSB">Woman-Owned Small Business</SelectItem>
                <SelectItem value="VOSB">Veteran-Owned Small Business</SelectItem>
                <SelectItem value="SDVOSB">Service-Disabled Veteran-Owned</SelectItem>
                <SelectItem value="HUBZONE">HUBZone</SelectItem>
                <SelectItem value="8A">8(a) Business Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="limit">Results Limit</Label>
            <Select value={searchParams.limit} onValueChange={(value) => handleChange("limit", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 results</SelectItem>
                <SelectItem value="50">50 results</SelectItem>
                <SelectItem value="100">100 results</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSearch} disabled={loading} className="w-full">
          {loading ? "Searching..." : "Search Opportunities"}
        </Button>
      </CardContent>
    </Card>
  )
}
