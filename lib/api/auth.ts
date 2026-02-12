/**
 * Authentication API functions
 * These will connect to the Python backend
 */

const API_BASE_URL = "/api"

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface ApiError {
  message: string
  code: string
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message || "Login failed")
  }

  return response.json()
}

export async function logoutUser(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message || "Logout failed")
  }
}

export async function refreshToken(refreshToken: string): Promise<{ access_token: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message || "Token refresh failed")
  }

  return response.json()
}
