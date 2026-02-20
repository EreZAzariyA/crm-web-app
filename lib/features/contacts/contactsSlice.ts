import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { CrmService, type Contact } from '@/lib/crm-service'

interface ContactsState {
  items: Contact[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: ContactsState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async () => {
  return CrmService.getContacts()
})

export const addContact = createAsyncThunk(
  'contacts/addContact',
  async (newContact: Omit<Contact, 'id' | 'lastActivity' | 'avatar'>) => {
    return CrmService.createContact(newContact)
  }
)

export const updateContact = createAsyncThunk(
  'contacts/updateContact',
  async ({ id, updates }: { id: string; updates: Partial<Contact> }) => {
    return CrmService.updateContact(id, updates)
  }
)

export const deleteContact = createAsyncThunk('contacts/deleteContact', async (id: string) => {
  await CrmService.deleteContact(id)
  return id
})

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to fetch contacts'
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload)
      })
  },
})

export default contactsSlice.reducer
