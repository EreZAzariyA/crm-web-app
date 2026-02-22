import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { CrmService, type Activity } from '@/lib/crm-service'
import { logoutUser, loginUser, registerUser, fetchCurrentUser } from '@/lib/features/auth/authSlice'

interface ActivitiesState {
  items: Activity[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: ActivitiesState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchActivities = createAsyncThunk('activities/fetchActivities', async () => {
  return CrmService.getActivities()
})

export const addActivity = createAsyncThunk(
  'activities/addActivity',
  async (newActivity: Omit<Activity, 'id' | 'time'>) => {
    return CrmService.createActivity(newActivity)
  }
)

export const deleteActivity = createAsyncThunk('activities/deleteActivity', async (id: string) => {
  await CrmService.deleteActivity(id)
  return id
})

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to fetch activities'
      })
      .addCase(addActivity.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a.id !== action.payload)
      })
      // Reset data when the user session is initialized or changed
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(loginUser.fulfilled, () => initialState)
      .addCase(registerUser.fulfilled, () => initialState)
      .addCase(fetchCurrentUser.fulfilled, () => initialState)
  },
})

export default activitiesSlice.reducer
