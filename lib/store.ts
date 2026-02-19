import { configureStore } from '@reduxjs/toolkit'
import contactsReducer from '@/lib/features/contacts/contactsSlice'
import dealsReducer from '@/lib/features/deals/dealsSlice'

export function makeStore() {
  return configureStore({
    reducer: {
      contacts: contactsReducer,
      deals: dealsReducer,
    },
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
