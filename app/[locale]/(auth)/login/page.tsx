'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { loginUser, clearError } from '@/lib/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from 'next-intl'

function LoginForm() {
  const t = useTranslations('Auth.login')
  const te = useTranslations('Auth.errors')
  
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { error } = useAppSelector((s) => s.auth)

  const oauthError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Use local state for submitting — avoids hydration mismatch caused by
  // auth.status being set to 'loading' by fetchCurrentUser on every page load
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    dispatch(clearError())
    setSubmitting(true)
    const result = await dispatch(loginUser({ email, password }))
    if (loginUser.fulfilled.match(result)) {
      router.push('/')
    } else {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <div className="flex justify-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-base font-bold text-primary-foreground">R</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('sub')}</p>
        </div>

        {(error || oauthError) && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error ?? te(oauthError as any) ?? t('error')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs text-muted-foreground">
              {t('email')}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs text-muted-foreground">
              {t('password')}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-secondary"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('signingIn') : t('signInEmail')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t('inviteOnly')}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
