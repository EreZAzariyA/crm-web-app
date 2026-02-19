import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { CrmService, type Deal } from '@/lib/crm-service'

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

// Thunks
export const fetchDeals = createAsyncThunk('deals/fetchDeals', async () => {
  const response = await CrmService.getDeals()
  return response
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
  },
})

export default dealsSlice.reducer
