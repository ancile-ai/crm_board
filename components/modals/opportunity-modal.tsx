"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OpportunityForm } from "@/components/forms/opportunity-form"

interface OpportunityModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity?: any
  onSuccess?: () => void
}

export function OpportunityModal({ isOpen, onClose, opportunity, onSuccess }: OpportunityModalProps) {
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      const [companiesRes, usersRes] = await Promise.all([fetch("/api/companies"), fetch("/api/users")])

      if (companiesRes.ok && usersRes.ok) {
        const [companiesData, usersData] = await Promise.all([companiesRes.json(), usersRes.json()])
        setCompanies(companiesData)
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (data: any) => {
    onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opportunity ? "Edit Opportunity" : "Create New Opportunity"}</DialogTitle>
        </DialogHeader>
        {!loading && (
          <OpportunityForm
            opportunity={opportunity}
            companies={companies}
            users={users}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
