import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/api-client/client'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  company: string
  role: string          // job title (free text)
  systemRole: 'admin' | 'manager' | 'user'
  teamId: string | null
  location: string
  bio: string
  notifications: {
    email: boolean
    push: boolean
    dealUpdates: boolean
    contactUpdates: boolean
    activityAlerts: boolean
    weeklyReport: boolean
  }
  appearance: {
    language: string
    theme: 'light' | 'dark' | 'system'
    sidebarCollapsed: boolean
    timezone: string
    dateFormat: string
  }
}

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  // 'status' tracks login / register / updateProfile actions only
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  // 'initStatus' tracks fetchCurrentUser (app-load check) separately so it
  // never bleeds into the login/register button disabled state
  initStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
  initStatus: 'idle',
  error: null,
}

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  const data = await apiClient.get<{ user: UserProfile }>('/auth/me')
  return data.user
})

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await apiClient.post<{ user: UserProfile }>('/auth/login', credentials)
      return data.user
    } catch (err) {
      return rejectWithValue((err as Error).message)
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    payload: { email: string; password: string; firstName: string; lastName: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await apiClient.post<{ user: UserProfile }>('/auth/register', payload)
      return data.user
    } catch (err) {
      return rejectWithValue((err as Error).message)
    }
  }
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await apiClient.post('/auth/logout', {})
})

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates: Partial<UserProfile> & { currentPassword?: string; newPassword?: string }, { rejectWithValue }) => {
    try {
      const data = await apiClient.put<{ id: string } & Partial<UserProfile>>('/users/me', updates)
      return data
    } catch (err) {
      return rejectWithValue((err as Error).message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCurrentUser — uses initStatus, never touches status
      .addCase(fetchCurrentUser.pending, (state) => {
        state.initStatus = 'loading'
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.initStatus = 'succeeded'
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.initStatus = 'failed'
        state.user = null
        state.isAuthenticated = false
      })
      // login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      // register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.status = 'succeeded'
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      // logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.status = 'idle'
      })
      // updateProfile
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload }
        }
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
