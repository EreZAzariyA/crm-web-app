"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Loader2,
  X,
  Building2,
  Briefcase,
  AtSign,
  PhoneCall,
  Download,
  Upload,
  FileText,
  AlertCircle,
} from "lucide-react"
import Papa from "papaparse"
import { toast } from "sonner"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Contact } from "@/lib/crm-service"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import {
  fetchContacts,
  addContact,
  updateContact,
  deleteContact,
} from "@/lib/features/contacts/contactsSlice"
import { updateDeal } from "@/lib/features/deals/dealsSlice"
import { exportToCSV } from "@/lib/utils/csv"
import { useTranslations } from "next-intl"
import { CSVImportDialog } from "@/components/shared/csv-import-dialog"
import { DetailRow } from "@/components/shared/detail-row"

// ─── Status helpers ─────────────────────────────────────────────────────────

const statusStyles: Record<Contact["status"], string> = {
  lead: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  prospect: "bg-warning/15 text-warning border-warning/30",
  customer: "bg-primary/15 text-primary border-primary/30",
  churned: "bg-destructive/15 text-destructive border-destructive/30",
}

// ─── Empty form state ────────────────────────────────────────────────────────

const emptyForm = {
  name: "",
  email: "",
  company: "",
  role: "",
  phone: "",
  status: "lead" as Contact["status"],
}

// ─── Contact Details (Sheet Content) ──────────────────────────────────────────
// ─── Main component ──────────────────────────────────────────────────────────

export function ContactsContent() {
  const t = useTranslations("Contacts")
  const common = useTranslations("Common")
  const tt = useTranslations("Toasts")
  const ta = useTranslations("Activity")
  const router   = useRouter()
  const dispatch = useAppDispatch()
  const { items: contacts, status } = useAppSelector((s) => s.contacts)
  const { items: deals } = useAppSelector((s) => s.deals)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mounted, setMounted] = useState(false)

  // ── Dialog / sheet state ──
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [viewContact, setViewContact] = useState<Contact | null>(null)
  const [deleteContact_, setDeleteContact] = useState<Contact | null>(null)
  const [addToDealContact, setAddToDealContact] = useState<Contact | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string>("")

  // ── Form state ──
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleImportContacts(data: any[]) {
    let successCount = 0
    let errorCount = 0

    for (const row of data) {
      try {
        const contactData = {
          name: row.name || row.Name || row.full_name || "",
          email: row.email || row.Email || "",
          company: row.company || row.Company || "",
          role: row.role || row.Role || row.title || row.Title || "",
          phone: row.phone || row.Phone || "",
          status: (row.status || row.Status || "lead").toLowerCase() as Contact["status"],
        }

        if (contactData.name && contactData.email) {
          await dispatch(addContact(contactData)).unwrap()
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    if (successCount > 0) {
      toast.success(t("import.success", {count: successCount}))
      dispatch(fetchContacts())
    }
    if (errorCount > 0) {
      toast.error(t("import.error", {count: errorCount}))
    }
  }

  useEffect(() => {
    setMounted(true)
    if (status === "idle") dispatch(fetchContacts())
  }, [status, dispatch])

  // ── Filtered list ──
  const filtered = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // ── Handlers: Add ──
  function openAdd() {
    setForm(emptyForm)
    setAddOpen(true)
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error(tt("requiredFields"))
      return
    }
    setSaving(true)
    try {
      await dispatch(addContact(form)).unwrap()
      toast.success(tt("saveSuccess"))
      setAddOpen(false)
    } catch {
      toast.error(tt("saveError"))
    } finally {
      setSaving(false)
    }
  }

  // ── Handlers: Edit ──
  function openEdit(contact: Contact) {
    setForm({
      name: contact.name,
      email: contact.email,
      company: contact.company,
      role: contact.role,
      phone: contact.phone,
      status: contact.status,
    })
    setEditContact(contact)
  }

  async function handleEdit() {
    if (!editContact) return
    if (!form.name.trim() || !form.email.trim()) {
      toast.error(tt("requiredFields"))
      return
    }
    setSaving(true)
    try {
      await dispatch(updateContact({ id: editContact.id, updates: form })).unwrap()
      toast.success(tt("updateSuccess"))
      setEditContact(null)
      // Refresh view sheet if open
      if (viewContact?.id === editContact.id) {
        setViewContact((prev) => prev ? { ...prev, ...form } : null)
      }
    } catch {
      toast.error(tt("updateError"))
    } finally {
      setSaving(false)
    }
  }

  // ── Handlers: Delete ──
  async function handleDelete() {
    if (!deleteContact_) return
    setDeleting(true)
    try {
      await dispatch(deleteContact(deleteContact_.id)).unwrap()
      toast.success(tt("deleteSuccess"))
      setDeleteContact(null)
      if (viewContact?.id === deleteContact_.id) setViewContact(null)
    } catch {
      toast.error(tt("deleteError"))
    } finally {
      setDeleting(false)
    }
  }

  // ── Handlers: Add to Deal ──
  async function handleAddToDeal() {
    if (!addToDealContact || !selectedDealId) {
      toast.error(tt("requiredFields"))
      return
    }
    setSaving(true)
    try {
      await dispatch(
        updateDeal({ id: selectedDealId, updates: { contact: addToDealContact.name } })
      ).unwrap()
      toast.success(tt("linkSuccess"))
      setAddToDealContact(null)
      setSelectedDealId("")
    } catch {
      toast.error(tt("linkError"))
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ──
  if (mounted && status === "loading") {
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
        <div className="flex flex-col gap-4">

          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-64 bg-secondary ps-8 text-sm"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Filter className="size-3.5" />
                    <span>
                      {statusFilter === "all"
                        ? t("status.all")
                        : t(`status.${statusFilter}` as any)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>{t("status.all")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("lead")}>{t("status.lead")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("prospect")}>{t("status.prospect")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("customer")}>{t("status.customer")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("churned")}>{t("status.churned")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="size-3.5" />
                {t("actions.import")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5"
                onClick={() =>
                  exportToCSV(filtered, "contacts.csv", {
                    name: t("table.name"),
                    email: t("table.email"),
                    company: t("table.company"),
                    role: t("table.role"),
                    status: t("table.status"),
                    phone: t("form.phone"),
                    lastActivity: t("table.lastActivity"),
                  })
                }
                disabled={filtered.length === 0}
              >
                <Download className="size-3.5" />
                {t("actions.export")}
              </Button>
              <Button size="sm" className="h-9 gap-1.5" onClick={openAdd}>
                <Plus className="size-3.5" />
                {t("addContact")}
              </Button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">{t("table.name")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("table.company")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("table.role")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("table.status")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("table.lastActivity")}</TableHead>
                  <TableHead className="text-muted-foreground w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      {t("table.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="border-border hover:bg-secondary/40 cursor-pointer"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {contact.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{contact.name}</span>
                            <span className="text-xs text-muted-foreground">{contact.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{contact.company}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{contact.role}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusStyles[contact.status as Contact["status"]]}
                        >
                          {t(`status.${contact.status}` as any)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{contact.lastActivity}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            onClick={() => window.open(`mailto:${contact.email}`)}
                            title={`Email ${contact.name}`}
                          >
                            <Mail className="size-3.5" />
                            <span className="sr-only">Email {contact.name}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            onClick={() => window.open(`tel:${contact.phone}`)}
                            title={`Call ${contact.name}`}
                          >
                            <Phone className="size-3.5" />
                            <span className="sr-only">Call {contact.name}</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="size-3.5" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => router.push(`/contacts/${contact.id}`)}>
                                {t("actions.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openEdit(contact)}>
                                {t("actions.editContact")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setAddToDealContact(contact)
                                  setSelectedDealId("")
                                }}
                              >
                                {t("actions.addToDeal")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteContact(contact)}
                              >
                                {t("actions.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("table.showing", {count: filtered.length, total: contacts.length})}
            </span>
          </div>
        </div>
      </div>

      <CSVImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImportContacts}
        title={t("import.title")}
        description={t("import.description")}
        mappingHint={t("import.mappingHint")}
        previewColumns={[
          { header: t("table.name"), key: "name" },
          { header: t("table.email"), key: "email" },
          { header: t("table.company"), key: "company" },
        ]}
      />


      {/* ═══════════════════════════════════════════════════════════════════
          ADD CONTACT DIALOG
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.addTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.addDescription")}</DialogDescription>
          </DialogHeader>
          <ContactForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              {common("cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("addContact")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          EDIT CONTACT DIALOG
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!editContact} onOpenChange={(open) => !open && setEditContact(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.editTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.editDescription")}</DialogDescription>
          </DialogHeader>
          <ContactForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContact(null)} disabled={saving}>
              {common("cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
              {common("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          VIEW DETAILS SHEET
      ═══════════════════════════════════════════════════════════════════ */}
      <Sheet open={!!viewContact} onOpenChange={(open) => !open && setViewContact(null)}>
        <SheetContent className="w-full sm:max-w-[420px] flex flex-col gap-0 p-0">
          {viewContact && (
            <>
              {/* Header */}
              <SheetHeader className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="size-14 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {viewContact.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg leading-tight">{viewContact.name}</SheetTitle>
                    <SheetDescription className="mt-0.5">
                      {viewContact.role} · {viewContact.company}
                    </SheetDescription>
                    <Badge
                      variant="outline"
                      className={`mt-2 ${statusStyles[viewContact.status as Contact["status"]]}`}
                    >
                      {t(`status.${viewContact.status}` as any)}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <Separator />

              {/* Details */}
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("info")}
                  </h4>
                  <div className="space-y-2.5">
                    <DetailRow icon={<AtSign className="size-4 text-muted-foreground" />} label={t("table.email")}>
                      <a
                        href={`mailto:${viewContact.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {viewContact.email}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<PhoneCall className="size-4 text-muted-foreground" />} label={t("form.phone")}>
                      <a
                        href={`tel:${viewContact.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {viewContact.phone || "—"}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<Building2 className="size-4 text-muted-foreground" />} label={t("table.company")}>
                      <span className="text-sm">{viewContact.company}</span>
                    </DetailRow>
                    <DetailRow icon={<Briefcase className="size-4 text-muted-foreground" />} label={t("role")}>
                      <span className="text-sm">{viewContact.role}</span>
                    </DetailRow>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {ta("title")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("lastActivity")}: <span className="text-foreground">{viewContact.lastActivity}</span>
                  </p>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="p-4 flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setViewContact(null)
                    openEdit(viewContact)
                  }}
                >
                  {t("actions.editContact")}
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => {
                    setViewContact(null)
                    setDeleteContact(viewContact)
                  }}
                >
                  {t("actions.delete")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION
      ═══════════════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteContact_}
        onOpenChange={(open) => !open && setDeleteContact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.deleteTitle", {name: deleteContact_?.name ?? ""})}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {common("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════════════
          ADD TO DEAL DIALOG
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!addToDealContact}
        onOpenChange={(open) => !open && setAddToDealContact(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.addToDealTitle", {name: addToDealContact?.name ?? ""})}</DialogTitle>
            <DialogDescription>
              {t("dialogs.addToDealDescription", {name: addToDealContact?.name ?? ""})}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="deal-select" className="mb-2 block text-sm">
              {t("dialogs.selectDeal")}
            </Label>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("dialogs.noDeals")}</p>
            ) : (
              <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                <SelectTrigger id="deal-select">
                  <SelectValue placeholder={t("dialogs.chooseDeal")} />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      <span className="font-medium">{deal.title}</span>
                      <span className="ms-2 text-muted-foreground text-xs">({deal.company})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToDealContact(null)} disabled={saving}>
              {common("cancel")}
            </Button>
            <Button onClick={handleAddToDeal} disabled={saving || !selectedDealId}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("dialogs.linkButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Shared form component ───────────────────────────────────────────────────

type FormState = {
  name: string
  email: string
  company: string
  role: string
  phone: string
  status: Contact["status"]
}

function ContactForm({
  form,
  onChange,
}: {
  form: FormState
  onChange: (f: FormState) => void
}) {
  const t = useTranslations("Contacts.form")
  const ts = useTranslations("Contacts.status")
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [field]: e.target.value })

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="cf-name">{t("fullName")}</Label>
          <Input id="cf-name" placeholder={t("placeholders.name")} value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="cf-email">{t("email")}</Label>
          <Input
            id="cf-email"
            type="email"
            placeholder={t("placeholders.email")}
            value={form.email}
            onChange={set("email")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-company">{t("company")}</Label>
          <Input id="cf-company" placeholder={t("placeholders.company")} value={form.company} onChange={set("company")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-role">{t("role")}</Label>
          <Input id="cf-role" placeholder={t("placeholders.role")} value={form.role} onChange={set("role")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-phone">{t("phone")}</Label>
          <Input id="cf-phone" placeholder={t("placeholders.phone")} value={form.phone} onChange={set("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-status">{t("status")}</Label>
          <Select
            value={form.status}
            onValueChange={(v) => onChange({ ...form, status: v as Contact["status"] })}
          >
            <SelectTrigger id="cf-status">
              <SelectValue />
            </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">{ts("lead")}</SelectItem>
                        <SelectItem value="prospect">{ts("prospect")}</SelectItem>
                        <SelectItem value="customer">{ts("customer")}</SelectItem>
                        <SelectItem value="churned">{ts("churned")}</SelectItem>
                      </SelectContent>          </Select>
        </div>
      </div>
    </div>
  )
}


