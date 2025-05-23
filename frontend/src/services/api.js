// This file should be placed in your React frontend project

// Base API URL
const API_URL = "http://localhost:5000/api"

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Registration failed")
    }

    return data
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}

// Login user
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Login failed")
    }

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
    }

    return data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

// Logout user
export const logoutUser = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem("user")
  return user ? JSON.parse(user) : null
}

// Get auth token
export const getToken = () => {
  return localStorage.getItem("token")
}

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken()
}

// Resend verification email
export const resendVerificationEmail = async (email) => {
  try {
    const response = await fetch(`${API_URL}/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to resend verification email")
    }

    return data
  } catch (error) {
    console.error("Resend verification error:", error)
    throw error
  }
}

// Forgot password - request password reset
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to send password reset email")
    }

    return data
  } catch (error) {
    console.error("Forgot password error:", error)
    throw error
  }
}

// Verify reset token
export const verifyResetToken = async (token) => {
  try {
    const response = await fetch(`${API_URL}/reset-password/${token}/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Invalid or expired token")
    }

    return data
  } catch (error) {
    console.error("Verify reset token error:", error)
    throw error
  }
}

// Reset password
export const resetPassword = async (token, passwords) => {
  try {
    const response = await fetch(`${API_URL}/reset-password/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(passwords),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to reset password")
    }

    return data
  } catch (error) {
    console.error("Reset password error:", error)
    throw error
  }
}
