"use client"

import { CrmLayout } from "@/components/crm-layout"
import { CompaniesListContent } from "@/components/company/companies-list-content"

export default function CompaniesPage() {
  return (
    <CrmLayout>
      <CompaniesListContent />
    </CrmLayout>
  )
}
