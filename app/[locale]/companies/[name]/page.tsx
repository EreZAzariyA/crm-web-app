"use client"

import { useParams } from "next/navigation"
import { CrmLayout } from "@/components/crm-layout"
import { CompanyProfileContent } from "@/components/company/company-profile-content"

export default function CompanyDetailPage() {
  const params = useParams<{ name: string }>()
  const companyName = decodeURIComponent(params.name)

  return (
    <CrmLayout>
      <CompanyProfileContent companyName={companyName} />
    </CrmLayout>
  )
}
