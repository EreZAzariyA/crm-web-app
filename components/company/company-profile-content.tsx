"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from "@/i18n/routing"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchDeals } from "@/lib/features/deals/dealsSlice"
import { fetchContacts } from "@/lib/features/contacts/contactsSlice"
import { useTranslations } from "next-intl"
import { CompanyOverviewTab } from "./company-overview-tab"
import { CompanyLoansTable } from "./company-loans-table"
import { CompanyContactsTable } from "./company-contacts-table"
import { CompanyHealthTab } from "./company-health-tab"
import { CompanyFinancialReportsTab } from "./company-financial-reports-tab"

interface CompanyProfileContentProps {
  companyName: string
}

export function CompanyProfileContent({ companyName }: CompanyProfileContentProps) {
  const t = useTranslations("Companies")
  const dispatch = useAppDispatch()
  const { items: allDeals, status: dealsStatus } = useAppSelector((s) => s.deals)
  const { items: allContacts, status: contactsStatus } = useAppSelector((s) => s.contacts)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (dealsStatus === "idle") dispatch(fetchDeals())
    if (contactsStatus === "idle") dispatch(fetchContacts())
  }, [dealsStatus, contactsStatus, dispatch])

  const companyDeals = useMemo(
    () => allDeals.filter((d) => d.company?.trim().toLowerCase() === companyName.toLowerCase()),
    [allDeals, companyName]
  )

  const companyContacts = useMemo(
    () => allContacts.filter((c) => c.company?.trim().toLowerCase() === companyName.toLowerCase()),
    [allContacts, companyName]
  )

  const isLoading = mounted && (dealsStatus === "loading" || contactsStatus === "loading")

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalValue = companyDeals.reduce((sum, d) => sum + d.value, 0)

  return (
    <>
      <CrmHeader title={companyName} description={t("description")} />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Back link and header summary */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/companies">
                  <ArrowLeft className="size-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{companyName}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">
                    {t("deals", { count: companyDeals.length })}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {t("contacts", { count: companyContacts.length })}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {t("totalValue")}: ${totalValue.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="flex flex-col gap-4">
            <TabsList className="w-fit">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="loans">{t("tabs.loans")}</TabsTrigger>
              <TabsTrigger value="contacts">{t("tabs.contacts")}</TabsTrigger>
              <TabsTrigger value="health">{t("tabs.financialHealth")}</TabsTrigger>
              <TabsTrigger value="reports">{t("tabs.financialReports")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <CompanyOverviewTab deals={companyDeals} contacts={companyContacts} />
            </TabsContent>

            <TabsContent value="loans">
              <CompanyLoansTable deals={companyDeals} />
            </TabsContent>

            <TabsContent value="contacts">
              <CompanyContactsTable contacts={companyContacts} />
            </TabsContent>

            <TabsContent value="health">
              <CompanyHealthTab deals={companyDeals} />
            </TabsContent>

            <TabsContent value="reports">
              <CompanyFinancialReportsTab companyName={companyName} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
