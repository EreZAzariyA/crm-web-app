'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LockKeyhole } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
  const t = useTranslations('Auth.register')
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <LockKeyhole className="size-7 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('sub')}
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/login">{t('backToSignIn')}</Link>
        </Button>
      </div>
    </div>
  )
}
