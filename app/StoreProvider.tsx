'use client'
import { useRef, useEffect } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '@/lib/store'
import { fetchCurrentUser } from '@/lib/features/auth/authSlice'
import { fetchContacts } from '@/lib/features/contacts/contactsSlice'
import { fetchDeals } from '@/lib/features/deals/dealsSlice'
import { fetchActivities } from '@/lib/features/activities/activitiesSlice'

export default function StoreProvider({
  children
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  useEffect(() => {
    const store = storeRef.current!
    store.dispatch(fetchCurrentUser())
    store.dispatch(fetchContacts())
    store.dispatch(fetchDeals())
    store.dispatch(fetchActivities())
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}
