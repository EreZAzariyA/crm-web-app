"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
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

// ─── Status helpers ─────────────────────────────────────────────────────────

const statusStyles: Record<Contact["status"], string> = {
  lead: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  prospect: "bg-warning/15 text-warning border-warning/30",
  customer: "bg-primary/15 text-primary border-primary/30",
  churned: "bg-destructive/15 text-destructive border-destructive/30",
}

const statusLabels: Record<Contact["status"], string> = {
  lead: "Lead",
  prospect: "Prospect",
  customer: "Customer",
  churned: "Churned",
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

// ─── Main component ──────────────────────────────────────────────────────────

export function ContactsContent() {
  const dispatch = useAppDispatch()
  const { items: contacts, status } = useAppSelector((s) => s.contacts)
  const { items: deals } = useAppSelector((s) => s.deals)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mounted, setMounted] = useState(false)

  // ── Dialog / sheet state ──
  const [addOpen, setAddOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [viewContact, setViewContact] = useState<Contact | null>(null)
  const [deleteContact_, setDeleteContact] = useState<Contact | null>(null)
  const [addToDealContact, setAddToDealContact] = useState<Contact | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string>("")

  // ── Form state ──
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
      toast.error("Name and email are required")
      return
    }
    setSaving(true)
    try {
      await dispatch(addContact(form)).unwrap()
      toast.success(`${form.name} added successfully`)
      setAddOpen(false)
    } catch {
      toast.error("Failed to add contact")
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
      toast.error("Name and email are required")
      return
    }
    setSaving(true)
    try {
      await dispatch(updateContact({ id: editContact.id, updates: form })).unwrap()
      toast.success(`${form.name} updated successfully`)
      setEditContact(null)
      // Refresh view sheet if open
      if (viewContact?.id === editContact.id) {
        setViewContact((prev) => prev ? { ...prev, ...form } : null)
      }
    } catch {
      toast.error("Failed to update contact")
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
      toast.success(`${deleteContact_.name} deleted`)
      setDeleteContact(null)
      if (viewContact?.id === deleteContact_.id) setViewContact(null)
    } catch {
      toast.error("Failed to delete contact")
    } finally {
      setDeleting(false)
    }
  }

  // ── Handlers: Add to Deal ──
  async function handleAddToDeal() {
    if (!addToDealContact || !selectedDealId) {
      toast.error("Please select a deal")
      return
    }
    setSaving(true)
    try {
      await dispatch(
        updateDeal({ id: selectedDealId, updates: { contact: addToDealContact.name } })
      ).unwrap()
      toast.success(`${addToDealContact.name} linked to deal`)
      setAddToDealContact(null)
      setSelectedDealId("")
    } catch {
      toast.error("Failed to link contact to deal")
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
      <CrmHeader title="Contacts" description="Manage your contacts and leads" />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-4">

          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-64 bg-secondary pl-8 text-sm"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <Filter className="size-3.5" />
                    <span>
                      {statusFilter === "all"
                        ? "All Status"
                        : statusLabels[statusFilter as Contact["status"]]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("lead")}>Lead</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("prospect")}>Prospect</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("customer")}>Customer</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("churned")}>Churned</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button size="sm" className="h-9 gap-1.5" onClick={openAdd}>
              <Plus className="size-3.5" />
              Add Contact
            </Button>
          </div>

          {/* ── Table ── */}
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Company</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Last Activity</TableHead>
                  <TableHead className="text-muted-foreground w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No contacts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="border-border hover:bg-secondary/40 cursor-pointer"
                      onClick={() => setViewContact(contact)}
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
                          {statusLabels[contact.status as Contact["status"]]}
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
                              >
                                <MoreHorizontal className="size-3.5" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewContact(contact)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(contact)}>
                                Edit Contact
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setAddToDealContact(contact)
                                  setSelectedDealId("")
                                }}
                              >
                                Add to Deal
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteContact(contact)}
                              >
                                Delete
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
              Showing {filtered.length} of {contacts.length} contacts
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ADD CONTACT DIALOG
      ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Fill in the details to add a new contact.</DialogDescription>
          </DialogHeader>
          <ContactForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Add Contact
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
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update the contact information below.</DialogDescription>
          </DialogHeader>
          <ContactForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContact(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
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
                      {statusLabels[viewContact.status as Contact["status"]]}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <Separator />

              {/* Details */}
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Contact Info
                  </h4>
                  <div className="space-y-2.5">
                    <DetailRow icon={<AtSign className="size-4 text-muted-foreground" />} label="Email">
                      <a
                        href={`mailto:${viewContact.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {viewContact.email}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<PhoneCall className="size-4 text-muted-foreground" />} label="Phone">
                      <a
                        href={`tel:${viewContact.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {viewContact.phone || "—"}
                      </a>
                    </DetailRow>
                    <DetailRow icon={<Building2 className="size-4 text-muted-foreground" />} label="Company">
                      <span className="text-sm">{viewContact.company}</span>
                    </DetailRow>
                    <DetailRow icon={<Briefcase className="size-4 text-muted-foreground" />} label="Role">
                      <span className="text-sm">{viewContact.role}</span>
                    </DetailRow>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Activity
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Last active: <span className="text-foreground">{viewContact.lastActivity}</span>
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
                  Edit Contact
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => {
                    setViewContact(null)
                    setDeleteContact(viewContact)
                  }}
                >
                  Delete
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
            <AlertDialogTitle>Delete {deleteContact_?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The contact and all associated data will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
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
            <DialogTitle>Add to Deal</DialogTitle>
            <DialogDescription>
              Link <strong>{addToDealContact?.name}</strong> to an existing deal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="deal-select" className="mb-2 block text-sm">
              Select Deal
            </Label>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals available.</p>
            ) : (
              <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                <SelectTrigger id="deal-select">
                  <SelectValue placeholder="Choose a deal…" />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      <span className="font-medium">{deal.title}</span>
                      <span className="ml-2 text-muted-foreground text-xs">({deal.company})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToDealContact(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleAddToDeal} disabled={saving || !selectedDealId}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Link to Deal
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
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [field]: e.target.value })

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="cf-name">Full Name *</Label>
          <Input id="cf-name" placeholder="Jane Smith" value={form.name} onChange={set("name")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="cf-email">Email *</Label>
          <Input
            id="cf-email"
            type="email"
            placeholder="jane@company.com"
            value={form.email}
            onChange={set("email")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-company">Company</Label>
          <Input id="cf-company" placeholder="Acme Corp" value={form.company} onChange={set("company")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-role">Role</Label>
          <Input id="cf-role" placeholder="VP of Sales" value={form.role} onChange={set("role")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-phone">Phone</Label>
          <Input id="cf-phone" placeholder="+1 555 000 0000" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-status">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => onChange({ ...form, status: v as Contact["status"] })}
          >
            <SelectTrigger id="cf-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="churned">Churned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ─── Detail row helper ───────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}
