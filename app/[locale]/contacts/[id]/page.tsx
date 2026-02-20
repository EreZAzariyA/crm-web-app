"use client"

import { use } from "react"
import { CrmLayout } from "@/components/crm-layout"
import { ContactDetailContent } from "@/components/contacts/contact-detail-content"

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <CrmLayout>
      <ContactDetailContent contactId={id} />
    </CrmLayout>
  )
}
