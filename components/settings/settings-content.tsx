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
import { useTranslations, useLocale } from "next-intl"

function ProfileTab() {
  const t = useTranslations("Settings.profile")
  const tt = useTranslations("Toasts")
  const common = useTranslations("Common")
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
      toast.success(t("saveSuccess"))
    } else {
      toast.error(t("saveError"))
    }
  }

  const initials = `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() || "?"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("sub")}
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
            {t("changeAvatar")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("avatarHint")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-xs text-muted-foreground">
            {t("firstName")}
          </Label>
          <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} className="bg-secondary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-xs text-muted-foreground">
            {t("lastName")}
          </Label>
          <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} className="bg-secondary" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="size-3" />
            {t("email")}
          </span>
        </Label>
        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="bg-secondary" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3" />
            {t("phone")}
          </span>
        </Label>
        <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className="bg-secondary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company" className="text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3" />
              {t("company")}
            </span>
          </Label>
          <Input id="company" name="company" value={form.company} onChange={handleChange} className="bg-secondary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role" className="text-xs text-muted-foreground">
            {t("role")}
          </Label>
          <Input id="role" name="role" value={form.role} onChange={handleChange} className="bg-secondary" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3" />
            {t("location")}
          </span>
        </Label>
        <Input id="location" name="location" value={form.location} onChange={handleChange} className="bg-secondary" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-xs text-muted-foreground">
          {t("bio")}
        </Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder={t("bioPlaceholder")}
          className="bg-secondary min-h-20 resize-none"
          value={form.bio}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="size-3.5" />
          {common("save")}
        </Button>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const t = useTranslations("Settings.notifications")
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
      toast.success(t("saveSuccess"))
    } else {
      toast.error(t("saveError"))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("sub")}
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("channels")}
        </h4>
        <div className="space-y-3">
          <NotificationRow
            label={t("email")}
            description={t("emailSub")}
            checked={prefs.email}
            onCheckedChange={() => toggle("email")}
          />
          <NotificationRow
            label={t("push")}
            description={t("pushSub")}
            checked={prefs.push}
            onCheckedChange={() => toggle("push")}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("activity")}
        </h4>
        <div className="space-y-3">
          <NotificationRow
            label={t("dealUpdates")}
            description={t("dealUpdatesSub")}
            checked={prefs.dealUpdates}
            onCheckedChange={() => toggle("dealUpdates")}
          />
          <NotificationRow
            label={t("contactUpdates")}
            description={t("contactUpdatesSub")}
            checked={prefs.contactUpdates}
            onCheckedChange={() => toggle("contactUpdates")}
          />
          <NotificationRow
            label={t("activityAlerts")}
            description={t("activityAlertsSub")}
            checked={prefs.activityAlerts}
            onCheckedChange={() => toggle("activityAlerts")}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("reports")}
        </h4>
        <div className="space-y-3">
          <NotificationRow
            label={t("weekly")}
            description={t("weeklySub")}
            checked={prefs.weeklyReport}
            onCheckedChange={() => toggle("weeklyReport")}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="size-3.5" />
          {t("saveButton")}
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
  const t = useTranslations("Settings.appearance")
  const tt = useTranslations("Toasts")
  const common = useTranslations("Common")
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { theme: currentTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [appearance, setAppearance] = useState({
    language: "en",
    theme: "dark" as "light" | "dark" | "system",
    sidebarCollapsed: false,
    timezone: "pst",
    dateFormat: "mdy",
  })

  useEffect(() => {
    setMounted(true)
    if (user?.appearance) {
      setAppearance({
        language: user.appearance.language ?? "en",
        theme: user.appearance.theme ?? (currentTheme as any) ?? "dark",
        sidebarCollapsed: !!user.appearance.sidebarCollapsed,
        timezone: user.appearance.timezone ?? "pst",
        dateFormat: user.appearance.dateFormat ?? "mdy",
      })
    }
  }, [user, currentTheme])

  async function handleSave() {
    const result = await dispatch(updateProfile({ appearance }))
    if (updateProfile.fulfilled.match(result)) {
      toast.success(tt("saveSuccess"))
      setTheme(appearance.theme)
    } else {
      toast.error(tt("saveError"))
    }
  }

  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    setAppearance(prev => ({ ...prev, theme: newTheme }))
    setTheme(newTheme)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("sub")}
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("theme")}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <ThemeOption
            label={t("themeLight")}
            active={mounted && appearance.theme === "light"}
            onClick={() => handleThemeChange("light")}
            preview="bg-white border-zinc-200"
          />
          <ThemeOption
            label={t("themeDark")}
            active={mounted && appearance.theme === "dark"}
            onClick={() => handleThemeChange("dark")}
            preview="bg-zinc-900 border-zinc-700"
          />
          <ThemeOption
            label={t("themeSystem")}
            active={mounted && appearance.theme === "system"}
            onClick={() => handleThemeChange("system")}
            preview="bg-gradient-to-r from-white to-zinc-900 border-zinc-400"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("display")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Globe className="size-3" />
                {t("language")}
              </span>
            </Label>
            <Select value={appearance.language} onValueChange={(v) => setAppearance((p) => ({ ...p, language: v }))}>
              <SelectTrigger id="language" className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("languages.en")}</SelectItem>
                <SelectItem value="he">{t("languages.he")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-xs text-muted-foreground">
              {t("timezone")}
            </Label>
            <Select value={appearance.timezone} onValueChange={(v) => setAppearance((p) => ({ ...p, timezone: v }))}>
              <SelectTrigger id="timezone" className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pst">{t("timezones.pst")}</SelectItem>
                <SelectItem value="mst">{t("timezones.mst")}</SelectItem>
                <SelectItem value="cst">{t("timezones.cst")}</SelectItem>
                <SelectItem value="est">{t("timezones.est")}</SelectItem>
                <SelectItem value="utc">{t("timezones.utc")}</SelectItem>
                <SelectItem value="ist">{t("timezones.ist")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateFormat" className="text-xs text-muted-foreground">
            {t("dateFormat")}
          </Label>
          <Select value={appearance.dateFormat} onValueChange={(v) => setAppearance((p) => ({ ...p, dateFormat: v }))}>
            <SelectTrigger id="dateFormat" className="bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mdy">{t("dateFormats.mdy")}</SelectItem>
              <SelectItem value="dmy">{t("dateFormats.dmy")}</SelectItem>
              <SelectItem value="ymd">{t("dateFormats.ymd")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground">{t("sidebarCollapse")}</span>
            <p className="text-xs text-muted-foreground">{t("sidebarCollapseSub")}</p>
          </div>
          <Switch 
            checked={appearance.sidebarCollapsed} 
            onCheckedChange={(checked) => setAppearance(p => ({ ...p, sidebarCollapsed: checked }))} 
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="size-3.5" />
          {common("save")}
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
  const t = useTranslations("Settings.account")
  const tt = useTranslations("Toasts")
  const common = useTranslations("Common")
  const dispatch = useAppDispatch()
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

  function handlePwChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handlePasswordUpdate() {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error(t("passwordMismatch"))
      return
    }
    const result = await dispatch(
      updateProfile({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
    )
    if (updateProfile.fulfilled.match(result)) {
      toast.success(t("passwordSuccess"))
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } else {
      toast.error((result.payload as string) || tt("updateError"))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t("sub")}
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("password")}
        </h4>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">
              {t("currentPassword")}
            </Label>
            <Input id="currentPassword" name="currentPassword" type="password" value={pwForm.currentPassword} onChange={handlePwChange} className="bg-secondary" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs text-muted-foreground">
                {t("newPassword")}
              </Label>
              <Input id="newPassword" name="newPassword" type="password" value={pwForm.newPassword} onChange={handlePwChange} className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
                {t("confirmPassword")}
              </Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={pwForm.confirmPassword} onChange={handlePwChange} className="bg-secondary" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handlePasswordUpdate}>
              {t("updatePassword")}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("sessions")}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-foreground">{t("currentSession")}</span>
              <p className="text-xs text-muted-foreground">
                {t("active")}
              </p>
            </div>
            <span className="text-xs font-medium text-primary">{t("active")}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("dangerZone")}
        </h4>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-foreground">{t("deleteAccount")}</span>
              <p className="text-xs text-muted-foreground">
                {t("deleteAccountSub")}
              </p>
            </div>
            <Button variant="destructive" size="sm">
              {t("deleteAccount")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SettingsContent() {
  const t = useTranslations("Settings")
  const locale = useLocale()
  const isHe = locale === "he"

  return (
    <>
      <CrmHeader title={t("title")} description={t("description")} />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Tabs defaultValue="profile" className="space-y-6" dir={isHe ? "rtl" : "ltr"}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="profile" className="gap-1.5 text-xs">
              <User className="size-3.5" />
              <span className="hidden sm:inline">{t("tabs.profile")}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs">
              <Bell className="size-3.5" />
              <span className="hidden sm:inline">{t("tabs.notifications")}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-xs">
              <Palette className="size-3.5" />
              <span className="hidden sm:inline">{t("tabs.appearance")}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1.5 text-xs">
              <Shield className="size-3.5" />
              <span className="hidden sm:inline">{t("tabs.account")}</span>
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
