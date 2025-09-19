"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OpportunityForm } from "@/components/forms/opportunity-form"

interface OpportunityModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity?: any
  onSuccess?: (data?: any) => void
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
    // forward the saved/updated opportunity back to parent
    onSuccess?.(data)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-8 pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -top-1 -left-1 w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
              <div className="relative bg-white rounded-xl p-3 shadow-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-1">
                {opportunity ? "Edit Opportunity" : "Create New Opportunity"}
              </DialogTitle>
              <p className="text-slate-600 text-sm font-medium">
                {opportunity ? "Update the details below to modify this opportunity" : "Fill out the form below to create a new opportunity"}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="p-8 pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-slate-600">Loading...</span>
            </div>
          ) : (
            <OpportunityForm
              opportunity={opportunity}
              companies={companies}
              users={users}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
