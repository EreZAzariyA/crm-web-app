"use client"

import {
  LayoutDashboard,
  Users,
  Kanban,
  Activity,
  Settings,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { logoutUser } from "@/lib/features/auth/authSlice"

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Contacts",  href: "/contacts", icon: Users },
  { title: "Deals",     href: "/deals", icon: Kanban },
  { title: "Activity",  href: "/activity", icon: Activity },
]

const secondaryItems = [
  { title: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const contactCount = useAppSelector((s) => s.contacts.items.length)
  const dealCount = useAppSelector((s) => s.deals.items.length)
  const activityCount = useAppSelector((s) => s.activities.items.length)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    await dispatch(logoutUser())
    router.push("/login")
  }

  // Render stable placeholder until after hydration; then show real user data
  const fullName = mounted && user ? `${user.firstName} ${user.lastName}`.trim() || user.email : ""
  const email = mounted ? (user?.email ?? "") : ""
  const initials = mounted && user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : ""

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* ── Logo / Brand ── */}
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
            <span className="text-sm font-bold text-primary-foreground">R</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Relay</span>
            <span className="text-[11px] text-muted-foreground">CRM Platform</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 overflow-x-hidden">
        {/* Navigation */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const badge =
                  item.href === "/contacts" && contactCount > 0 ? String(contactCount) :
                  item.href === "/deals" && dealCount > 0 ? String(dealCount) :
                  item.href === "/activity" && activityCount > 0 ? String(activityCount) :
                  null
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                      className="h-9 gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge && (
                      <SidebarMenuBadge className="rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
                        {badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 mx-2" />

        {/* System */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="h-9 gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User footer ── */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex min-w-0 w-full items-center gap-2.5 rounded-md px-1 py-1 hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center">
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-semibold text-sidebar-foreground">{fullName}</span>
                <span className="truncate text-[11px] text-muted-foreground">{email}</span>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">{fullName}</span>
                <span className="text-[11px] text-muted-foreground">{email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <User className="size-3.5" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="size-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
