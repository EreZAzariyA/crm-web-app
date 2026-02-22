"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ShieldCheck, Users, UserCheck, UserX,
  Plus, MoreHorizontal, Loader2, RefreshCw,
  Kanban, Activity, Building2,
  TrendingUp, DollarSign, Copy, Check, Link2,
  Pencil, Trash2, UserPlus, Crown,
} from "lucide-react"
import { toast } from "sonner"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useAppSelector } from "@/lib/hooks"
import { apiClient } from "@/lib/api-client/client"
import { useTranslations, useLocale } from "next-intl"

// ─── Types ────────────────────────────────────────────────────────────────────

type SystemRole = "admin" | "manager" | "user"

interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  systemRole: SystemRole
  isActive: boolean
  teamId: string | null
  createdAt: string
}

interface AdminInvite {
  token: string
  email: string
  firstName: string
  lastName: string
  systemRole: SystemRole
  teamId: string | null
  expiresAt: string
  usedAt: string | null
  createdAt: string
  status: "pending" | "used" | "expired"
}

interface TeamMember {
  userId: string
  firstName: string
  lastName: string
  email: string
  avatar: string | null
  role: "lead" | "member"
}

interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  lead: string | null
  members: TeamMember[]
  createdAt: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const roleStyles: Record<SystemRole, string> = {
  admin:   "bg-destructive/15 text-destructive border-destructive/30",
  manager: "bg-warning/15 text-warning border-warning/30",
  user:    "bg-primary/15 text-primary border-primary/30",
}

const PIPELINE_CONFIG = [
  { key: "lead",              dotColor: "bg-chart-2",      barColor: "bg-chart-2" },
  { key: "pre_qualification", dotColor: "bg-chart-5",      barColor: "bg-chart-5" },
  { key: "underwriting",      dotColor: "bg-warning",      barColor: "bg-warning" },
  { key: "approved",          dotColor: "bg-chart-3",      barColor: "bg-chart-3" },
  { key: "active",            dotColor: "bg-primary",      barColor: "bg-primary" },
  { key: "monitoring",        dotColor: "bg-chart-4",      barColor: "bg-chart-4" },
  { key: "collection",        dotColor: "bg-orange-500",   barColor: "bg-orange-500" },
  { key: "closed_won",        dotColor: "bg-emerald-500",  barColor: "bg-emerald-500" },
  { key: "closed_lost",       dotColor: "bg-destructive",  barColor: "bg-destructive" },
  { key: "default",           dotColor: "bg-red-700",      barColor: "bg-red-700" },
]

const emptyInviteForm = {
  email: "", firstName: "", lastName: "",
  systemRole: "user" as SystemRole,
  teamId: "",
}

const emptyTeamForm = { name: "", description: "" }

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Copy button helper ───────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations("Common")
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 shrink-0" onClick={copy}>
      {copied ? <Check className="size-3.5 text-chart-2" /> : <Copy className="size-3.5" />}
      {copied ? t("copied") : t("copy")}
    </Button>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ users, teams }: { users: AdminUser[]; teams: Team[] }) {
  const t = useTranslations("Admin.overview")
  const tr = useTranslations("Admin.roles")
  const contacts   = useAppSelector((s) => s.contacts.items)
  const deals      = useAppSelector((s) => s.deals.items)
  const activities = useAppSelector((s) => s.activities.items)

  const totalRevenue   = deals.filter((d) => d.stage === "closed_won").reduce((s, d) => s + d.value, 0)
  const openDeals      = deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
  const pipelineValue  = openDeals.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* CRM stats */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("crm")}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="size-5 text-chart-2" />}       label={t("totalContacts")}   value={contacts.length}    color="bg-chart-2/10" />
          <StatCard icon={<Kanban className="size-5 text-warning" />}      label={t("totalLoans")}      value={deals.length}       sub={`${openDeals.length} ${t("active")}`}   color="bg-warning/10" />
          <StatCard icon={<DollarSign className="size-5 text-primary" />}  label={t("portfolioValue")}  value={`$${pipelineValue.toLocaleString()}`} sub={`$${totalRevenue.toLocaleString()} ${t("repaid")}`} color="bg-primary/10" />
          <StatCard icon={<Activity className="size-5 text-chart-5" />}    label={t("totalActivities")} value={activities.length}  sub={t("logged")}                        color="bg-chart-5/10" />
        </div>
      </div>

      {/* Workspace stats */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("workspace")}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="size-5 text-primary" />}           label={t("totalUsers")}  value={users.length}   sub={`${users.filter(u => u.isActive).length} ${t("active")}`}  color="bg-primary/10" />
          <StatCard icon={<ShieldCheck className="size-5 text-destructive" />} label={t("admins")}       value={users.filter(u => u.systemRole === "admin").length}   sub={t("fullAccess")}  color="bg-destructive/10" />
          <StatCard icon={<Building2 className="size-5 text-warning" />}       label={t("teams")}        value={teams.length}   sub={`${teams.reduce((s, t) => s + t.memberCount, 0)} ${t("membersSub")}`}  color="bg-warning/10" />
          <StatCard icon={<UserX className="size-5 text-muted-foreground" />}  label={t("inactive")}     value={users.filter(u => !u.isActive).length}  sub={t("deactivated")}  color="bg-muted" />
        </div>
      </div>

      {/* Recent users */}
      {users.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("recentMembers")}</h3>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {users.slice(0, 5).map((u) => {
              const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase()
              const fullName = `${u.firstName} ${u.lastName}`.trim() || u.email
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${roleStyles[u.systemRole]}`}>{tr(u.systemRole)}</Badge>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${u.isActive ? "bg-chart-2/15 text-chart-2 border-chart-2/30" : "bg-muted text-muted-foreground"}`}>
                    {u.isActive ? t("active") : t("inactive")}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Pipeline tab ─────────────────────────────────────────────────────────────

function PipelineTab() {
  const deals = useAppSelector((s) => s.deals.items)
  const t = useTranslations("Admin.pipeline")
  const tStages = useTranslations("Stages")
  const common = useTranslations("Common")
  const totalDeals = deals.length || 1

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-secondary/40 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{t("conversionTitle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("conversionSub")}</p>
        </div>
        <div className="divide-y divide-border">
          {PIPELINE_CONFIG.map((stage) => {
            const stageDeals    = deals.filter((d) => d.stage === stage.key)
            const stageValue    = stageDeals.reduce((s, d) => s + d.value, 0)
            const stagePct      = Math.round((stageDeals.length / totalDeals) * 100)
            const weightedValue = stageDeals.reduce((s, d) => s + d.value * (d.probability / 100), 0)
            return (
              <div key={stage.key} className="px-4 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`size-2.5 rounded-full shrink-0 ${stage.dotColor}`} />
                    <span className="text-sm font-medium text-foreground">{tStages(stage.key as any)}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{t("table.loansCount", {count: stageDeals.length})}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-end">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("table.value")}</p>
                      <p className="text-sm font-semibold text-foreground">${stageValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("table.weighted")}</p>
                      <p className="text-sm font-semibold text-foreground">${Math.round(weightedValue).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <Progress value={stagePct} className={`h-1.5 [&>div]:${stage.barColor}`} />
                <p className="mt-1 text-[10px] text-muted-foreground">{t("table.pctOfTotal", {count: stagePct})}</p>
              </div>
            )
          })}
        </div>
        <div className="border-t border-border bg-secondary/20 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("table.totalLoansAcross", {count: deals.length})}</span>
          <span className="text-xs font-semibold text-foreground">${deals.reduce((s, d) => s + d.value, 0).toLocaleString()} {t("table.totalPipeline")}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab({
  users, invites, teams, loading, currentUserId, search, onSearch,
  onRefresh, onRoleChange, onToggleActive, onOpenInvite, onRevokeInvite, onAssignTeam,
}: {
  users: AdminUser[]
  invites: AdminInvite[]
  teams: Team[]
  loading: boolean
  currentUserId?: string
  search: string
  onSearch: (v: string) => void
  onRefresh: () => void
  onRoleChange: (id: string, role: SystemRole) => void
  onToggleActive: (id: string, current: boolean) => void
  onOpenInvite: () => void
  onRevokeInvite: (token: string) => void
  onAssignTeam: (userId: string, teamId: string | null) => Promise<void>
}) {
  const t = useTranslations("Admin.users")
  const tr = useTranslations("Admin.roles")
  const common = useTranslations("Common")
  const to = useTranslations("Admin.overview")
  const tt = useTranslations("Toasts")
  const locale = useLocale()

  const [assignUser, setAssignUser] = useState<AdminUser | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string>("none")
  const [assigning, setAssigning] = useState(false)

  const filtered = search.trim()
    ? users.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
    : users

  const teamName = (teamId: string | null) => teams.find((t) => t.id === teamId)?.name ?? null

  const pendingInvites = invites.filter((i) => i.status === "pending")

  async function submitAssignTeam() {
    if (!assignUser) return
    setAssigning(true)
    try {
      await onAssignTeam(assignUser.id, selectedTeamId === "none" ? null : selectedTeamId)
      setAssignUser(null)
    } catch {
      // toast already shown in parent
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ... toolbar remains same ... */}
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="h-9 max-w-xs bg-secondary text-sm"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={onOpenInvite}>
            <Plus className="size-3.5" />
            {t("invite")}
          </Button>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_1.5fr_auto_auto_auto_auto] gap-3 border-b border-border bg-secondary/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{t("table.name")}</span>
          <span>{t("table.email")}</span>
          <span>{t("table.team")}</span>
          <span>{t("table.role")}</span>
          <span>{t("table.status")}</span>
          <span />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {search ? t("noResults") : t("noUsers")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((u) => {
              const isSelf   = u.id === currentUserId
              const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase()
              const fullName = `${u.firstName} ${u.lastName}`.trim() || u.email
              const joinedDate = new Date(u.createdAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', { month: "short", day: "numeric", year: "numeric" })
              const tName = teamName(u.teamId)
              return (
                <div key={u.id} className={`grid grid-cols-[1fr_1.5fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/20 ${!u.isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-sm font-medium text-foreground">
                        {fullName}
                        {isSelf && <span className="ms-1.5 text-[10px] text-muted-foreground">({t("table.you")})</span>}
                      </span>
                      {u.role && <span className="truncate text-xs text-muted-foreground">{u.role}</span>}
                      <span className="text-[10px] text-muted-foreground">{t("table.joined", {date: joinedDate})}</span>
                    </div>
                  </div>
                  <span className="truncate text-sm text-muted-foreground">{u.email}</span>
                  <span className="text-xs text-muted-foreground">{tName ?? <span className="text-muted-foreground/40">—</span>}</span>
                  <Badge variant="outline" className={`text-xs shrink-0 ${roleStyles[u.systemRole]}`}>{tr(u.systemRole)}</Badge>
                  <Badge variant="outline" className={`text-xs shrink-0 ${u.isActive ? "bg-chart-2/15 text-chart-2 border-chart-2/30" : "bg-muted text-muted-foreground border-border"}`}>
                    {u.isActive ? to("active") : to("inactive")}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" disabled={isSelf} title={isSelf ? t("table.cantModifySelf") : undefined}>
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">{t("table.changeRole")}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onRoleChange(u.id, "admin")}   disabled={u.systemRole === "admin"}   className="text-sm"><ShieldCheck className="me-2 size-3.5 text-destructive" />{tr("makeAdmin")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRoleChange(u.id, "manager")} disabled={u.systemRole === "manager"} className="text-sm"><UserCheck className="me-2 size-3.5 text-warning" />{tr("makeManager")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRoleChange(u.id, "user")}    disabled={u.systemRole === "user"}    className="text-sm"><Users className="me-2 size-3.5 text-primary" />{tr("makeUser")}</DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setSelectedTeamId(u.teamId || "none"); setAssignUser(u) }} className="text-sm">
                        <UserPlus className="me-2 size-3.5" />{t("table.assignTeam")}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onToggleActive(u.id, u.isActive)} className={`text-sm ${u.isActive ? "text-destructive focus:text-destructive" : ""}`}>
                        {u.isActive ? <><UserX className="me-2 size-3.5" />{tr("deactivate")}</> : <><UserCheck className="me-2 size-3.5" />{tr("activate")}</>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!assignUser} onOpenChange={(o) => !o && setAssignUser(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.assignTeamTitle", { name: assignUser ? `${assignUser.firstName} ${assignUser.lastName}`.trim() || assignUser.email : "" })}</DialogTitle>
            <DialogDescription>{t("dialogs.assignTeamDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("dialogs.selectTeam")}</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-muted-foreground italic">{t("dialogs.noTeam")}</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignUser(null)} disabled={assigning}>{common("cancel")}</Button>
            <Button onClick={submitAssignTeam} disabled={assigning}>
              {assigning && <Loader2 className="me-2 size-4 animate-spin" />}
              {common("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("showing", {count: filtered.length, total: users.length})}
        </p>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="flex flex-col gap-3">
          <Separator />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("pendingInvites", {count: pendingInvites.length})}
          </h3>
          <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
            {pendingInvites.map((inv) => {
              const tName = teamName(inv.teamId)
              const expires = new Date(inv.expiresAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', { month: "short", day: "numeric" })
              return (
                <div key={inv.token} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {inv.firstName} {inv.lastName}
                      {inv.firstName || inv.lastName ? "" : <span className="text-muted-foreground">{t("unnamed")}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${roleStyles[inv.systemRole]}`}>{tr(inv.systemRole)}</Badge>
                  {tName && <span className="text-xs text-muted-foreground shrink-0">{tName}</span>}
                  <span className="text-[10px] text-muted-foreground shrink-0">{t("expires", {date: expires})}</span>
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => onRevokeInvite(inv.token)}
                  >
                    {t("revoke")}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Teams tab ────────────────────────────────────────────────────────────────

function TeamsTab({
  teams, users, loading, onCreateTeam, onEditTeam, onDeleteTeam,
  onAddMember, onRemoveMember, onSetMemberRole,
}: {
  teams: Team[]
  users: AdminUser[]
  loading: boolean
  onCreateTeam: (name: string, description: string) => Promise<void>
  onEditTeam: (id: string, name: string, description: string) => Promise<void>
  onDeleteTeam: (id: string) => Promise<void>
  onAddMember: (teamId: string, userId: string, role: "lead" | "member") => Promise<void>
  onRemoveMember: (teamId: string, userId: string) => Promise<void>
  onSetMemberRole: (teamId: string, userId: string, role: "lead" | "member") => Promise<void>
}) {
  const t = useTranslations("Admin.teams")
  const common = useTranslations("Common")
  const tt = useTranslations("Toasts")
  
  const [createOpen, setCreateOpen]   = useState(false)
  const [editTeam,   setEditTeam]     = useState<Team | null>(null)
  const [deleteTeam, setDeleteTeam]   = useState<Team | null>(null)
  const [addMemberTeam, setAddMemberTeam] = useState<Team | null>(null)
  const [teamForm,   setTeamForm]     = useState(emptyTeamForm)
  const [saving,     setSaving]       = useState(false)
  const [deleting,   setDeleting]     = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedMemberRole, setSelectedMemberRole] = useState<"lead" | "member">("member")

  // Users not yet in the target team
  const usersNotInTeam = (team: Team) =>
    users.filter((u) => u.isActive && !team.members.some((m) => m.userId === u.id))

  async function submitCreate() {
    if (!teamForm.name.trim()) { toast.error(t("dialogs.nameRequired")); return }
    setSaving(true)
    try {
      await onCreateTeam(teamForm.name.trim(), teamForm.description.trim())
      setCreateOpen(false)
      setTeamForm(emptyTeamForm)
    } finally { setSaving(false) }
  }

  async function submitEdit() {
    if (!editTeam || !teamForm.name.trim()) { toast.error(t("dialogs.nameRequired")); return }
    setSaving(true)
    try {
      await onEditTeam(editTeam.id, teamForm.name.trim(), teamForm.description.trim())
      setEditTeam(null)
    } finally { setSaving(false) }
  }

  async function submitDelete() {
    if (!deleteTeam) return
    setDeleting(true)
    try {
      await onDeleteTeam(deleteTeam.id)
      setDeleteTeam(null)
    } finally { setDeleting(false) }
  }

  async function submitAddMember() {
    if (!addMemberTeam || !selectedUserId) { toast.error(t("dialogs.userRequired")); return }
    setSaving(true)
    try {
      await onAddMember(addMemberTeam.id, selectedUserId, selectedMemberRole)
      setSelectedUserId("")
      setSelectedMemberRole("member")
      setAddMemberTeam(null)
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("count", {count: teams.length})}
        </p>
        <Button size="sm" className="h-9 gap-1.5" onClick={() => { setTeamForm(emptyTeamForm); setCreateOpen(true) }}>
          <Plus className="size-3.5" />
          {t("create")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Building2 className="mx-auto size-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{t("noTeams")}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t("noTeamsSub")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Team header */}
              <div className="flex items-start justify-between gap-3 p-4 pb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground truncate">{team.name}</h4>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
                      {t("members", {count: team.memberCount})}
                    </Badge>
                  </div>
                  {team.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{team.description}</p>
                  )}
                  {team.lead && (
                    <div className="flex items-center gap-1 mt-1">
                      <Crown className="size-3 text-warning" />
                      <span className="text-[10px] text-muted-foreground">{t("lead", {name: team.lead})}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => { setTeamForm({ name: team.name, description: team.description }); setEditTeam(team) }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTeam(team)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Member list */}
              <div className="p-3 flex flex-col gap-1">
                {team.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 text-center py-2">{t("noMembers")}</p>
                ) : (
                  team.members.map((m) => {
                    const initials = `${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase() || m.email[0].toUpperCase()
                    const fullName = `${m.firstName} ${m.lastName}`.trim() || m.email
                    return (
                      <div key={m.userId} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50">
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-xs text-foreground truncate">{fullName}</span>
                        {m.role === "lead" && <Crown className="size-3 text-warning shrink-0" />}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-5 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="size-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              disabled={m.role === "lead"}
                              onClick={() => onSetMemberRole(team.id, m.userId, "lead")}
                              className="text-xs"
                            >
                              <Crown className="me-2 size-3 text-warning" />{t("dialogs.teamLead")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={m.role === "member"}
                              onClick={() => onSetMemberRole(team.id, m.userId, "member")}
                              className="text-xs"
                            >
                              <UserCheck className="me-2 size-3" />{t("dialogs.member")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs text-destructive focus:text-destructive"
                              onClick={() => onRemoveMember(team.id, m.userId)}
                            >
                              <UserX className="me-2 size-3" />{common("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })
                )}

                {/* Add member button */}
                <Button
                  variant="ghost" size="sm"
                  className="mt-1 h-7 w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground justify-start"
                  onClick={() => { setSelectedUserId(""); setSelectedMemberRole("member"); setAddMemberTeam(team) }}
                >
                  <UserPlus className="size-3.5" />
                  {t("addMember")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create team dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.createTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.createSub")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="team-name">{t("dialogs.name")}</Label>
              <Input id="team-name" placeholder={t("dialogs.namePlaceholder")} value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-desc">{t("dialogs.desc")}</Label>
              <Input id="team-desc" placeholder="..." value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>{common("cancel")}</Button>
            <Button onClick={submitCreate} disabled={saving}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit team dialog */}
      <Dialog open={!!editTeam} onOpenChange={(o) => !o && setEditTeam(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-name">{t("dialogs.name")}</Label>
              <Input id="edit-team-name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-team-desc">{t("dialogs.desc")}</Label>
              <Input id="edit-team-desc" value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTeam(null)} disabled={saving}>{common("cancel")}</Button>
            <Button onClick={submitEdit} disabled={saving}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
              {common("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete team dialog */}
      <AlertDialog open={!!deleteTeam} onOpenChange={(o) => !o && setDeleteTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle", {name: deleteTeam?.name ?? ""})}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteSub", {count: deleteTeam?.memberCount ?? 0})}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={submitDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {common("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add member dialog */}
      <Dialog open={!!addMemberTeam} onOpenChange={(o) => !o && setAddMemberTeam(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.addMemberTitle", {name: addMemberTeam?.name ?? ""})}</DialogTitle>
            <DialogDescription>{t("dialogs.addMemberSub")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("dialogs.userLabel")}</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="..." />
                </SelectTrigger>
                <SelectContent>
                  {addMemberTeam && usersNotInTeam(addMemberTeam).length === 0 ? (
                    <div className="py-2 text-center text-xs text-muted-foreground">{t("dialogs.allInTeam")}</div>
                  ) : (
                    addMemberTeam && usersNotInTeam(addMemberTeam).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} <span className="text-muted-foreground text-xs">({u.email})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("dialogs.roleLabel")}</Label>
              <Select value={selectedMemberRole} onValueChange={(v) => setSelectedMemberRole(v as "lead" | "member")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{t("dialogs.member")}</SelectItem>
                  <SelectItem value="lead">{t("dialogs.teamLead")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberTeam(null)} disabled={saving}>{common("cancel")}</Button>
            <Button onClick={submitAddMember} disabled={saving || !selectedUserId}>
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("addMember")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminContent() {
  const t = useTranslations("Admin")
  const common = useTranslations("Common")
  const tt = useTranslations("Toasts")
  const tr = useTranslations("Admin.roles")
  const currentUser = useAppSelector((s) => s.auth.user)

  const [users,       setUsers]       = useState<AdminUser[]>([])
  const [invites,     setInvites]     = useState<AdminInvite[]>([])
  const [teams,       setTeams]       = useState<Team[]>([])
  const [loading,     setLoading]     = useState(true)
  const [inviteOpen,  setInviteOpen]  = useState(false)
  const [inviteForm,  setInviteForm]  = useState(emptyInviteForm)
  const [inviting,    setInviting]    = useState(false)
  const [inviteLink,  setInviteLink]  = useState<string | null>(null)
  const [search,      setSearch]      = useState("")

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, invitesData, teamsData] = await Promise.all([
        apiClient.get<{ users: AdminUser[] }>("/admin/users"),
        apiClient.get<{ invites: AdminInvite[] }>("/admin/invites"),
        apiClient.get<{ teams: Team[] }>("/admin/teams"),
      ])
      setUsers(usersData.users)
      setInvites(invitesData.invites)
      setTeams(teamsData.teams)
    } catch {
      toast.error(tt("error"))
    } finally {
      setLoading(false)
    }
  }, [tt])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Role / active ──
  async function handleRoleChange(userId: string, newRole: SystemRole) {
    try {
      const data = await apiClient.put<{ user: AdminUser }>(`/admin/users/${userId}`, { systemRole: newRole })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, systemRole: data.user.systemRole } : u))
      toast.success(tt("updateSuccess"))
    } catch (err) {
      toast.error((err as Error).message || tt("updateError"))
    }
  }

  async function handleToggleActive(userId: string, currentlyActive: boolean) {
    try {
      const data = await apiClient.put<{ user: AdminUser }>(`/admin/users/${userId}`, { isActive: !currentlyActive })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: data.user.isActive } : u))
      toast.success(currentlyActive ? tt("updateSuccess") : tt("updateSuccess"))
    } catch (err) {
      toast.error((err as Error).message || tt("updateError"))
    }
  }

  // ── Invite link ──
  async function handleInvite() {
    if (!inviteForm.email || !inviteForm.firstName) {
      toast.error(tt("requiredFields"))
      return
    }
    setInviting(true)
    try {
      const data = await apiClient.post<{ inviteUrl: string; invite: AdminInvite }>("/admin/invites", {
        email: inviteForm.email,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        systemRole: inviteForm.systemRole,
        teamId: inviteForm.teamId || undefined,
      })
      setInvites((prev) => [data.invite, ...prev])
      setInviteLink(data.inviteUrl)
    } catch (err) {
      toast.error((err as Error).message || tt("error"))
    } finally {
      setInviting(false)
    }
  }

  async function handleRevokeInvite(token: string) {
    try {
      await apiClient.delete(`/admin/invites/${token}`)
      setInvites((prev) => prev.filter((i) => i.token !== token))
      toast.success(tt("inviteRevoked"))
    } catch (err) {
      toast.error((err as Error).message || tt("error"))
    }
  }

  // ── Teams ──
  async function handleCreateTeam(name: string, description: string) {
    try {
      const data = await apiClient.post<{ team: Team }>("/admin/teams", { name, description })
      setTeams((prev) => [...prev, data.team])
      toast.success(tt("saveSuccess"))
    } catch (err) {
      toast.error((err as Error).message || tt("saveError"))
    }
  }

  async function handleEditTeam(id: string, name: string, description: string) {
    try {
      await apiClient.put(`/admin/teams/${id}`, { name, description })
      setTeams((prev) => prev.map((t) => t.id === id ? { ...t, name, description } : t))
      toast.success(tt("updateSuccess"))
    } catch (err) {
      toast.error((err as Error).message || tt("updateError"))
    }
  }

  async function handleDeleteTeam(id: string) {
    try {
      await apiClient.delete(`/admin/teams/${id}`)
      setTeams((prev) => prev.filter((t) => t.id !== id))
      // Clear teamId from affected users in local state
      setUsers((prev) => prev.map((u) => u.teamId === id ? { ...u, teamId: null } : u))
      toast.success(tt("deleteSuccess"))
    } catch (err) {
      toast.error((err as Error).message || tt("deleteError"))
    }
  }

  async function handleAssignTeam(userId: string, teamId: string | null) {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    try {
      if (teamId) {
        await handleAddMember(teamId, userId, "member")
      } else if (user.teamId) {
        await handleRemoveMember(user.teamId, userId)
      }
    } catch { /* sub-functions handle toasts */ }
  }

  async function handleAddMember(teamId: string, userId: string, role: "lead" | "member") {
    try {
      const data = await apiClient.post<{ member: TeamMember }>(`/admin/teams/${teamId}/members`, { userId, role })
      setTeams((prev) => prev.map((t) => {
        if (t.id !== teamId) return t
        const existing = t.members.find((m) => m.userId === userId)
        const newMembers = existing
          ? t.members.map((m) => m.userId === userId ? data.member : m)
          : [...t.members, data.member]
        return { ...t, members: newMembers, memberCount: newMembers.length, lead: newMembers.find((m) => m.role === "lead") ? `${newMembers.find((m) => m.role === "lead")!.firstName} ${newMembers.find((m) => m.role === "lead")!.lastName}`.trim() : null }
      }))
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, teamId } : u))
      toast.success(tt("updateSuccess"))
    } catch (err) {
      toast.error((err as Error).message || tt("updateError"))
    }
  }

  async function handleRemoveMember(teamId: string, userId: string) {
    try {
      await apiClient.delete(`/admin/teams/${teamId}/members`, { userId })
      setTeams((prev) => prev.map((t) => {
        if (t.id !== teamId) return t
        const newMembers = t.members.filter((m) => m.userId !== userId)
        return { ...t, members: newMembers, memberCount: newMembers.length }
      }))
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, teamId: null } : u))
      toast.success(tt("deleteSuccess"))
    } catch (err) {
      toast.error((err as Error).message || tt("deleteError"))
    }
  }

  async function handleSetMemberRole(teamId: string, userId: string, role: "lead" | "member") {
    try {
      const data = await apiClient.post<{ member: TeamMember }>(`/admin/teams/${teamId}/members`, { userId, role })
      setTeams((prev) => prev.map((t) => {
        if (t.id !== teamId) return t
        const newMembers = t.members.map((m) => m.userId === userId ? data.member : m)
        return { ...t, members: newMembers, lead: newMembers.find((m) => m.role === "lead") ? `${newMembers.find((m) => m.role === "lead")!.firstName} ${newMembers.find((m) => m.role === "lead")!.lastName}`.trim() : null }
      }))
      toast.success(tt("updateSuccess"))
    } catch (err) {
      toast.error((err as Error).message || tt("updateError"))
    }
  }

  return (
    <>
      <CrmHeader title={t("title")} description={t("description")} />

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs defaultValue="overview" className="flex flex-col gap-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="users">
                {t("tabs.users")}
                {users.length > 0 && <Badge variant="secondary" className="ms-1.5 h-4 px-1.5 text-[10px]">{users.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="teams">
                {t("tabs.teams")}
                {teams.length > 0 && <Badge variant="secondary" className="ms-1.5 h-4 px-1.5 text-[10px]">{teams.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="pipeline">{t("tabs.pipeline")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <OverviewTab users={users} teams={teams} />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab
              users={users}
              invites={invites}
              teams={teams}
              loading={loading}
              currentUserId={currentUser?.id}
              search={search}
              onSearch={setSearch}
              onRefresh={loadAll}
              onRoleChange={handleRoleChange}
              onToggleActive={handleToggleActive}
              onOpenInvite={() => { setInviteForm(emptyInviteForm); setInviteLink(null); setInviteOpen(true) }}
              onRevokeInvite={handleRevokeInvite}
              onAssignTeam={handleAssignTeam}
            />
          </TabsContent>

          <TabsContent value="teams">
            <TeamsTab
              teams={teams}
              users={users}
              loading={loading}
              onCreateTeam={handleCreateTeam}
              onEditTeam={handleEditTeam}
              onDeleteTeam={handleDeleteTeam}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onSetMemberRole={handleSetMemberRole}
            />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ INVITE USER DIALOG ═══ */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) { setInviteOpen(false); setInviteLink(null) } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("users.invite")}</DialogTitle>
            <DialogDescription>{t("users.inviteDescription")}</DialogDescription>
          </DialogHeader>

          {inviteLink ? (
            /* ── Step 2: Show invite link ── */
            <div className="flex flex-col gap-4 py-2">
              <div className="rounded-lg bg-chart-2/10 border border-chart-2/30 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-chart-2">
                  <Link2 className="size-4 shrink-0" />
                  <span className="text-sm font-medium">{t("users.inviteGenerated")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border border-border bg-secondary px-3 py-1.5 overflow-hidden">
                    <p className="text-xs text-muted-foreground truncate font-mono">{inviteLink}</p>
                  </div>
                  <CopyButton text={inviteLink} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("users.inviteShareHint", {name: `${inviteForm.firstName} ${inviteForm.lastName}`, email: inviteForm.email})}
                </p>
              </div>
              <Button onClick={() => { setInviteOpen(false); setInviteLink(null) }}>{common("done")}</Button>
            </div>
          ) : (
            /* ── Step 1: Invite form ── */
            <>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-first">{t("users.form.firstName")}</Label>
                    <Input id="inv-first" placeholder="Jane" value={inviteForm.firstName} onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inv-last">{t("users.form.lastName")}</Label>
                    <Input id="inv-last" placeholder="Smith" value={inviteForm.lastName} onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-email">{t("users.form.email")}</Label>
                  <Input id="inv-email" type="email" placeholder="jane@company.com" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("users.form.role")}</Label>
                    <Select value={inviteForm.systemRole} onValueChange={(v) => setInviteForm({ ...inviteForm, systemRole: v as SystemRole })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{tr("user")}</SelectItem>
                        <SelectItem value="manager">{tr("manager")}</SelectItem>
                        <SelectItem value="admin">{tr("admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("users.form.team")}</Label>
                    <Select value={inviteForm.teamId || "none"} onValueChange={(v) => setInviteForm({ ...inviteForm, teamId: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder={t("users.form.noTeam")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("users.form.noTeam")}</SelectItem>
                        {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>{common("cancel")}</Button>
                <Button onClick={handleInvite} disabled={inviting}>
                  {inviting && <Loader2 className="me-2 size-4 animate-spin" />}
                  {t("users.generateInvite")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
