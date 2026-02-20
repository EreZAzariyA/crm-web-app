import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { CrmService, type Deal } from '@/lib/crm-service'
import { logoutUser, loginUser } from '@/lib/features/auth/authSlice'

interface DealsState {
  items: Deal[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: DealsState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchDeals = createAsyncThunk('deals/fetchDeals', async () => {
  return CrmService.getDeals()
})

export const addDeal = createAsyncThunk('deals/addDeal', async (newDeal: Omit<Deal, 'id'>) => {
  return CrmService.createDeal(newDeal)
})

export const updateDeal = createAsyncThunk(
  'deals/updateDeal',
  async ({ id, updates }: { id: string; updates: Partial<Deal> }) => {
    return CrmService.updateDeal(id, updates)
  }
)

export const deleteDeal = createAsyncThunk('deals/deleteDeal', async (id: string) => {
  await CrmService.deleteDeal(id)
  return id
})

const dealsSlice = createSlice({
  name: 'deals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeals.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to fetch deals'
      })
      .addCase(addDeal.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(updateDeal.fulfilled, (state, action) => {
        const idx = state.items.findIndex((d) => d.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(deleteDeal.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload)
      })
      // Reset data when the user logs out or logs in as a different user
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(loginUser.fulfilled, () => initialState)
  },
})

export default dealsSlice.reducer
