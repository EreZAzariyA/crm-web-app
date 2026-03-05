"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Loader2, Search, Kanban, Users } from "lucide-react"
import { CrmHeader } from "@/components/crm-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/routing"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchDeals } from "@/lib/features/deals/dealsSlice"
import { fetchContacts } from "@/lib/features/contacts/contactsSlice"
import { useTranslations } from "next-intl"

interface CompanySummary {
  name: string
  dealCount: number
  contactCount: number
  totalValue: number
}

export function CompaniesListContent() {
  const t = useTranslations("Companies")
  const dispatch = useAppDispatch()
  const { items: deals, status: dealsStatus } = useAppSelector((s) => s.deals)
  const { items: contacts, status: contactsStatus } = useAppSelector((s) => s.contacts)
  const [search, setSearch] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (dealsStatus === "idle") dispatch(fetchDeals())
    if (contactsStatus === "idle") dispatch(fetchContacts())
  }, [dealsStatus, contactsStatus, dispatch])

  const companies = useMemo(() => {
    const map = new Map<string, CompanySummary>()

    for (const deal of deals) {
      if (!deal.company || deal.company.trim() === "") continue
      const name = deal.company.trim()
      if (!map.has(name)) {
        map.set(name, { name, dealCount: 0, contactCount: 0, totalValue: 0 })
      }
      const entry = map.get(name)!
      entry.dealCount++
      entry.totalValue += deal.value
    }

    for (const contact of contacts) {
      if (!contact.company || contact.company.trim() === "") continue
      const name = contact.company.trim()
      if (!map.has(name)) {
        map.set(name, { name, dealCount: 0, contactCount: 0, totalValue: 0 })
      }
      map.get(name)!.contactCount++
    }

    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue)
  }, [deals, contacts])

  const filtered = useMemo(() => {
    if (!search.trim()) return companies
    const q = search.toLowerCase()
    return companies.filter((c) => c.name.toLowerCase().includes(q))
  }, [companies, search])

  const isLoading = mounted && (dealsStatus === "loading" || contactsStatus === "loading")

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <CrmHeader title={t("title")} description={t("description")} />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="size-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">{t("noCompanies")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("noCompaniesSub")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((company) => (
                <Link key={company.name} href={`/companies/${encodeURIComponent(company.name)}`}>
                  <Card className="border-border bg-card transition-colors hover:bg-accent cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="size-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {company.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Kanban className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {t("deals", { count: company.dealCount })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {t("contacts", { count: company.contactCount })}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-[10px]">
                              {t("totalValue")}: ${company.totalValue.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
