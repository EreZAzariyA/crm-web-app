"use client"

import { useState, useEffect } from "react"
import { Plus, Filter, Search, MoreHorizontal, Mail, Phone, Loader2 } from "lucide-react"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { type Contact } from "@/lib/crm-data"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { fetchContacts } from "@/lib/features/contacts/contactsSlice"

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

export function ContactsContent() {
  const dispatch = useAppDispatch()
  const { items: contacts, status } = useAppSelector((state) => state.contacts)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchContacts())
    }
  }, [status, dispatch])

  const filtered = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || contact.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (status === 'loading') {
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
          {/* Toolbar */}
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
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("lead")}>
                    Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("prospect")}>
                    Prospect
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("customer")}>
                    Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("churned")}>
                    Churned
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="size-3.5" />
              Add Contact
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Company</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Last Activity</TableHead>
                  <TableHead className="text-muted-foreground w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="border-border hover:bg-secondary/40 cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {contact.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {contact.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contact.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {contact.company}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.role}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusStyles[contact.status as Contact["status"]]}
                      >
                        {statusLabels[contact.status as Contact["status"]]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.lastActivity}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="size-3.5" />
                          <span className="sr-only">Email {contact.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
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
                              <span className="sr-only">More options for {contact.name}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                            <DropdownMenuItem>Add to Deal</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
    </>
  )
}
