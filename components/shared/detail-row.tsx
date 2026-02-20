import React from "react"

interface DetailRowProps {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}

export function DetailRow({ icon, label, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">
          {children}
        </div>
      </div>
    </div>
  )
}
