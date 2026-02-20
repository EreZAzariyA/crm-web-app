"use client"

import { useState, useEffect } from "react"
import {
  User,
  Bell,
  Palette,
  Shield,
  Save,
  Globe,
  Mail,
  Phone,
  Building2,
  MapPin,
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { CrmHeader } from "@/components/crm-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { updateProfile } from "@/lib/features/auth/authSlice"

function ProfileTab() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    location: "",
    bio: "",
  })

  // Sync form with user data after mount (avoids hydration mismatch)
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        company: user.company ?? "",
        role: user.role ?? "",
        location: user.location ?? "",
        bio: user.bio ?? "",
      })
    }
  }, [user])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    const result = await dispatch(updateProfile(form))
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Profile saved")
    } else {
      toast.error("Failed to save profile")
    }
  }

  const initials = `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() || "?"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Profile Information</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Update your personal details and contact information.
        </p>
      </div>
      <Separator />

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <Button variant="outline" size="sm">
            Change Avatar
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-xs text-muted-foreground">
            First Name
          </Label>
          <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} className="bg-secondary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-xs text-muted-foreground">
            Last Name
          </Label>
          <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} className="bg-secondary" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="size-3" />
            Email Address
          </span>
        </Label>
        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="bg-secondary" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3" />
            Phone Number
          </span>
        </Label>
        <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className="bg-secondary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company" className="text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3" />
              Company
            </span>
          </Label>
          <Input id="company" name="company" value={form.company} onChange={handleChange} className="bg-secondary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role" className="text-xs text-muted-foreground">
            Role
          </Label>
          <Input id="role" name="role" value={form.role} onChange={handleChange} className="bg-secondary" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3" />
            Location
          </span>
        </Label>
        <Input id="location" name="location" value={form.location} onChange={handleChange} className="bg-secondary" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-xs text-muted-foreground">
          Bio
        </Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Tell us about yourself..."
          className="bg-secondary min-h-20 resize-none"
          value={form.bio}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="size-3.5" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    dealUpdates: true,
    contactUpdates: false,
    activityAlerts: true,
    weeklyReport: true,
  })

  // Sync with user preferences after mount (avoids hydration mismatch)
  useEffect(() => {
    if (user?.notifications) {
      setPrefs({
        email: user.notifications.email ?? true,
        push: user.notifications.push ?? true,
        dealUpdates: user.notifications.dealUpdates ?? true,
        contactUpdates: user.notifications.contactUpdates ?? false,
        activityAlerts: user.notifications.activityAlerts ?? true,
        weeklyReport: user.notifications.weeklyReport ?? true,
      })
    }
  }, [user])

  function toggle(key: keyof typeof prefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    const result = await dispatch(updateProfile({ notifications: prefs }))
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Notification preferences saved")
    } else {
      toast.error("Failed to save preferences")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Choose how and when you want to be notified.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Channels
        </h4>
        <div className="space-y-3">
          <NotificationRow
            label="Email Notifications"
            description="Receive notifications via email"
            checked={prefs.email}
            onCheckedChange={() => toggle("email")}
          />
          <NotificationRow
            label="Push Notifications"
            description="Receive push notifications in browser"
            checked={prefs.push}
            onCheckedChange={() => toggle("push")}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Activity
        </h4>
        <div className="space-y-3">
          <NotificationRow
            label="Deal Updates"
            description="When a deal status or stage changes"
            checked={prefs.dealUpdates}
            onCheckedChange={() => toggle("dealUpdates")}
          />
          <NotificationRow
            label="Contact Updates"
            description="When a contact is added or modified"
            checked={prefs.contactUpdates}
            onCheckedChange={() => toggle("contactUpdates")}
          />
          <NotificationRow
            label="Activity Alerts"
            description="When new activity is logged for your deals"
            checked={prefs.activityAlerts}
            onCheckedChange={() => toggle("activityAlerts")}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Reports
        </h4>
        <div className="space-y-3">
          <NotificationRow
            label="Weekly Summary"
            description="Receive a weekly email with your CRM summary"
            checked={prefs.weeklyReport}
            onCheckedChange={() => toggle("weeklyReport")}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="size-3.5" />
          Save Preferences
        </Button>
      </div>
    </div>
  )
}

function NotificationRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <div className="space-y-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function AppearanceTab() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [appearance, setAppearance] = useState({
    language: "en",
    timezone: "pst",
    dateFormat: "mdy",
  })

  // Sync with user preferences and mark mounted (avoids hydration mismatch)
  useEffect(() => {
    setMounted(true)
    if (user?.appearance) {
      setAppearance({
        language: user.appearance.language ?? "en",
        timezone: user.appearance.timezone ?? "pst",
        dateFormat: user.appearance.dateFormat ?? "mdy",
      })
    }
  }, [user])

  async function handleSave() {
    const result = await dispatch(updateProfile({ appearance }))
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Appearance preferences saved")
    } else {
      toast.error("Failed to save preferences")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Customize the look and feel of the application.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Theme
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ThemeOption
            label="Light"
            active={mounted && theme === "light"}
            onClick={() => setTheme("light")}
            preview="bg-white border-zinc-200"
          />
          <ThemeOption
            label="Dark"
            active={mounted && theme === "dark"}
            onClick={() => setTheme("dark")}
            preview="bg-zinc-900 border-zinc-700"
          />
          <ThemeOption
            label="System"
            active={mounted && theme === "system"}
            onClick={() => setTheme("system")}
            preview="bg-gradient-to-r from-white to-zinc-900 border-zinc-400"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Display
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Globe className="size-3" />
                Language
              </span>
            </Label>
            <Select value={appearance.language} onValueChange={(v) => setAppearance((p) => ({ ...p, language: v }))}>
              <SelectTrigger id="language" className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="he">Hebrew</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-xs text-muted-foreground">
              Timezone
            </Label>
            <Select value={appearance.timezone} onValueChange={(v) => setAppearance((p) => ({ ...p, timezone: v }))}>
              <SelectTrigger id="timezone" className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                <SelectItem value="cst">Central Time (CST)</SelectItem>
                <SelectItem value="est">Eastern Time (EST)</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="ist">Israel Standard Time (IST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateFormat" className="text-xs text-muted-foreground">
            Date Format
          </Label>
          <Select value={appearance.dateFormat} onValueChange={(v) => setAppearance((p) => ({ ...p, dateFormat: v }))}>
            <SelectTrigger id="dateFormat" className="bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
              <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
              <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="size-3.5" />
          Save Preferences
        </Button>
      </div>
    </div>
  )
}

function ThemeOption({
  label,
  active,
  onClick,
  preview,
}: {
  label: string
  active: boolean
  onClick: () => void
  preview: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-muted-foreground/30"
      }`}
    >
      <div className={`h-8 w-full rounded-md border ${preview}`} />
      <span
        className={`text-xs font-medium ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  )
}

function AccountTab() {
  const dispatch = useAppDispatch()
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

  function handlePwChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handlePasswordUpdate() {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    const result = await dispatch(
      updateProfile({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
    )
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Password updated")
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } else {
      toast.error((result.payload as string) || "Failed to update password")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Account & Security</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your account security and preferences.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Password
        </h4>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">
              Current Password
            </Label>
            <Input id="currentPassword" name="currentPassword" type="password" value={pwForm.currentPassword} onChange={handlePwChange} className="bg-secondary" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs text-muted-foreground">
                New Password
              </Label>
              <Input id="newPassword" name="newPassword" type="password" value={pwForm.newPassword} onChange={handlePwChange} className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
                Confirm New Password
              </Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={pwForm.confirmPassword} onChange={handlePwChange} className="bg-secondary" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handlePasswordUpdate}>
              Update Password
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Sessions
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-foreground">Current Session</span>
              <p className="text-xs text-muted-foreground">
                Active session
              </p>
            </div>
            <span className="text-xs font-medium text-primary">Active</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Danger Zone
        </h4>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-foreground">Delete Account</span>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SettingsContent() {
  return (
    <>
      <CrmHeader title="Settings" description="Manage your account settings and preferences" />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="profile" className="gap-1.5 text-xs">
              <User className="size-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs">
              <Bell className="size-3.5" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-xs">
              <Palette className="size-3.5" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1.5 text-xs">
              <Shield className="size-3.5" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          <div className="max-w-2xl">
            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsTab />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceTab />
            </TabsContent>
            <TabsContent value="account">
              <AccountTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}
