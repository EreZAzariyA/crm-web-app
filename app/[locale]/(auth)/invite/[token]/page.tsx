'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppDispatch } from '@/lib/hooks'
import { fetchCurrentUser } from '@/lib/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

type InviteInfo = {
  email: string
  firstName: string
  lastName: string
  systemRole: string
}

type Status = 'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'submitting' | 'success'

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const t = useTranslations('Auth.invite')
  const tr = useTranslations('Admin.roles')
  const tAuth = useTranslations('Auth.register')
  
  const { token } = use(params)
  const router = useRouter()
  const dispatch = useAppDispatch()

  const [status, setStatus] = useState<Status>('loading')
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/auth/invite/${token}`)
        if (res.ok) {
          const data = await res.json()
          setInvite(data)
          setStatus('valid')
        } else {
          const data = await res.json()
          if (res.status === 410) {
            const msg = data.error ?? ''
            setErrorMsg(msg)
            setStatus(msg.toLowerCase().includes('expired') ? 'expired' : 'used')
          } else {
            setErrorMsg(data.error ?? t('invalidLink'))
            setStatus('invalid')
          }
        }
      } catch {
        setErrorMsg(t('validateFailed'))
        setStatus('invalid')
      }
    }
    validateToken()
  }, [token, t])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError('')

    if (password.length < 8) {
      setValidationError(t('passMinLen'))
      return
    }
    if (password !== confirm) {
      setValidationError(t('passMismatch'))
      return
    }

    setStatus('submitting')
    try {
      const res = await fetch(`/api/auth/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setValidationError(data.error ?? t('accountFailed'))
        setStatus('valid')
        return
      }

      // Sync Redux auth state then redirect
      await dispatch(fetchCurrentUser())
      setStatus('success')
      setTimeout(() => router.push('/'), 1500)
    } catch {
      setValidationError('Something went wrong. Please try again.')
      setStatus('valid')
    }
  }

  // ── Loading state ──
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Success state ──
  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-12 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">{t('success')}</h1>
          <p className="text-sm text-muted-foreground">{t('redirecting')}</p>
        </div>
      </div>
    )
  }

  // ── Error states ──
  if (status === 'invalid' || status === 'expired' || status === 'used') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <XCircle className="mx-auto size-12 text-destructive" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              {status === 'expired' ? t('expired') : status === 'used' ? t('used') : t('invalid')}
            </h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{tAuth('backToSignIn')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ── Accept invite form ──
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="space-y-1 text-center">
          <div className="flex justify-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-base font-bold text-primary-foreground">R</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('sub')}
          </p>
        </div>

        {/* Invite info */}
        {invite && (
          <div className="rounded-lg border border-border bg-secondary/50 px-4 py-3 space-y-1">
            <p className="text-sm font-medium text-foreground">
              {invite.firstName} {invite.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{invite.email}</p>
            <p className="text-xs text-muted-foreground">
              {t('role')}: <span className="text-foreground">{tr(invite.systemRole as any) ?? invite.systemRole}</span>
            </p>
          </div>
        )}

        {/* Password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {validationError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{t('setPass')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">{t('confirmPass')}</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
              className="bg-secondary"
            />
          </div>

          <Button type="submit" className="w-full" disabled={status === 'submitting'}>
            {status === 'submitting' && <Loader2 className="me-2 size-4 animate-spin" />}
            {t('createAccount')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t('alreadyHave')}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
