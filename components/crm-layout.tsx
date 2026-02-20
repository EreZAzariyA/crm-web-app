"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { GlobalSearch } from "@/components/global-search"
import { useAppSelector } from "@/lib/hooks"

export function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user)
  const defaultOpen = user?.appearance?.sidebarCollapsed === undefined 
    ? true 
    : !user.appearance.sidebarCollapsed

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {children}
      </SidebarInset>
      {/* Global search palette — mounted once, available everywhere via Cmd+K */}
      <GlobalSearch />
    </SidebarProvider>
  )
}
