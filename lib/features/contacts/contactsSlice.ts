import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
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

// Thunks
export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async () => {
  const response = await CrmService.getContacts()
  return response
})

export const addContact = createAsyncThunk('contacts/addContact', async (newContact: Omit<Contact, "id" | "lastActivity" | "avatar">) => {
  const response = await CrmService.createContact(newContact)
  return response
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
        state.items.push(action.payload)
      })
  },
})

export default contactsSlice.reducer
