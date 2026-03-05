"use client"

import { Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import type { IContact } from "@/lib/models/Contact"

interface CompanyContactsTableProps {
  contacts: IContact[]
}

const statusColors: Record<string, string> = {
  lead: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  prospect: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  customer: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  churned: "bg-red-500/15 text-red-600 border-red-500/30",
}

export function CompanyContactsTable({ contacts }: CompanyContactsTableProps) {
  const t = useTranslations("Companies.contactsTab")
  const tc = useTranslations("Contacts.status")

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Users className="size-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{t("noContacts")}</p>
      </div>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          {t("name")} ({contacts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">{t("name")}</th>
                <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">{t("role")}</th>
                <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">{t("status")}</th>
                <th className="text-start py-2 px-3 text-xs font-medium text-muted-foreground">{t("email")}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const contactId = (contact as any)._id || contact.name
                return (
                  <tr key={contactId} className="border-b border-border last:border-0 hover:bg-accent transition-colors">
                    <td className="py-2.5 px-3">
                      <Link href={`/contacts/${contactId}`} className="text-sm font-medium text-foreground hover:text-primary">
                        {contact.name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-muted-foreground">
                      {contact.role || "--"}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className={`${statusColors[contact.status] || ""} text-[10px]`}>
                        {tc(contact.status as any)}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-muted-foreground">
                      {contact.email}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
