import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from '@/lib/features/contacts/contactsSlice'
import dealsReducer from '@/lib/features/deals/dealsSlice'
import activitiesReducer from '@/lib/features/activities/activitiesSlice'
import authReducer from '@/lib/features/auth/authSlice'

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      contacts: contactsReducer,
      deals: dealsReducer,
      activities: activitiesReducer,
    },
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
