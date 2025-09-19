"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpportunityForm } from "@/components/forms/opportunity-form";
import { Loader2, X, Edit, Briefcase } from "lucide-react";

interface EditOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: any;
  onSuccess?: (data?: any) => void;
}

export function EditOpportunityModal({
  isOpen,
  onClose,
  opportunity,
  onSuccess,
}: EditOpportunityModalProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [companiesRes, usersRes] = await Promise.all([
        fetch("/api/companies"),
        fetch("/api/users"),
      ]);

      if (companiesRes.ok && usersRes.ok) {
        const [companiesData, usersData] = await Promise.all([
          companiesRes.json(),
          usersRes.json(),
        ]);
        setCompanies(companiesData);
        setUsers(usersData);
      } else {
        throw new Error("Failed to fetch required data")
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error; // Let error propagate
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = (data: any) => {
    console.log("[EDIT MODAL] Form submitted with data:", data);
    onSuccess?.(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-gray-200 shadow-xl rounded-lg mx-auto max-w-4xl max-h-[90vh] overflow-hidden p-0" showCloseButton={false}>
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-amber-600 text-sm font-semibold tracking-wide uppercase">EDIT OPPORTUNITY</span>
                <span className="text-gray-900 text-xl font-bold">Update Opportunity Details</span>
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-amber-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Loader2 className="animate-spin w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-base font-semibold">
                  Loading form data...
                </p>
                <p className="text-gray-500 text-sm max-w-md">
                  Please wait while we fetch the latest information to help you update this opportunity.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Currently editing:</p>
                    <p className="text-gray-700 text-base font-medium">{opportunity?.title}</p>
                    {opportunity?.stage && (
                      <p className="text-gray-500 text-sm mt-1">Stage: {opportunity.stage}</p>
                    )}
                  </div>
                </div>
              </div>
              <OpportunityForm
                opportunity={opportunity}
                companies={companies}
                users={users}
                onSubmit={handleSubmit}
                onCancel={onClose}
                hideCancelButton={true}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
