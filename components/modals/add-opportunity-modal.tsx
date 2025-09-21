"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OpportunityForm } from "@/components/forms/opportunity-form";
import { Loader2, X, Plus, Briefcase } from "lucide-react";

interface AddOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data?: any) => void;
  initialData?: any;
}

export function AddOpportunityModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AddOpportunityModalProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, initialData]); // Add initialData to dependencies to refetch when it changes

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

        // If initialData has a companyId that's not in the companies list, it means it was just created
        // and we need to add it to the list (e.g., from SAM.gov import)
        let enhancedCompanies = companiesData;
        if (initialData?.companyId) {
          const hasCompany = companiesData.some((company: any) => company.id === initialData.companyId);
          if (!hasCompany && initialData.company) {
            console.log("[AddOpportunityModal] ➕ Adding newly created company from initialData:", initialData.company);
            // Add the company from initialData to the list
            enhancedCompanies = [...companiesData, initialData.company];
          }
        }

        setCompanies(enhancedCompanies);
        setUsers(usersData);

        console.log("[AddOpportunityModal] 📊 Enhanced companies list:", enhancedCompanies.length, "companies");
        if (initialData?.companyId) {
          const foundCompany = enhancedCompanies.find((company: any) => company.id === initialData.companyId);
          console.log("[AddOpportunityModal] 🎯 Company lookup result:", foundCompany ? "Found" : "Not found", initialData.companyId);
        }
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
    console.log("[AddOpportunityModal] 🎯 HandleSubmit called:", {
      data,
      hasCompanyId: data?.companyId ? 'yes' : 'no',
      initialDataCompanyId: initialData?.companyId
    });
    if (onSuccess) {
      console.log("[AddOpportunityModal] Calling onSuccess callback");
      onSuccess(data);
    } else {
      console.log("[AddOpportunityModal] No onSuccess callback provided");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border border-gray-200 shadow-xl rounded-lg mx-auto max-w-4xl max-h-[90vh] overflow-hidden p-0" showCloseButton={false}>
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-blue-600 text-sm font-semibold tracking-wide uppercase">CREATE OPPORTUNITY</span>
                <span className="text-gray-900 text-xl font-bold">Add New Opportunity</span>
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 text-base font-semibold">
                  Loading form data...
                </p>
                <p className="text-gray-500 text-sm max-w-md">
                  Please wait while we fetch the latest information to help you create your opportunity.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <OpportunityForm
                opportunity={undefined}
                initialData={initialData}
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
