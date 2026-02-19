import { CrmHeader } from "@/components/crm-header"
import { SettingsContent } from "@/components/settings/settings-content"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <CrmHeader title="Settings" description="Manage your account settings and preferences" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <SettingsContent />
      </div>
    </div>
  )
}
