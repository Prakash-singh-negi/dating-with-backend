import jwt from "jsonwebtoken"
import crypto from "crypto"
import User from "../models/User.js"
import { sendVerificationEmail, sendPasswordResetEmail } from "../config/email.js"

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, birthdate, gender } = req.body

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      birthdate,
      gender,
      verificationToken,
      verificationTokenExpires,
    })

    await newUser.save()

    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, verificationToken)

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send verification email" })
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      userId: newUser._id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ success: false, message: "Server error during registration" })
  }
}

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token" })
    }

    // Update user verification status
    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()

    res.status(200).json({ success: true, message: "Email verified successfully! You can now log in." })
  } catch (error) {
    console.error("Email verification error:", error)
    res.status(500).json({ success: false, message: "Server error during email verification" })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" })
    }

    // Check if password is correct
    const isPasswordMatch = await user.comparePassword(password)
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" })
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: "Please verify your email before logging in" })
    }

    // Generate JWT token
    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ success: false, message: "Server error during login" })
  }
}

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Email already verified" })
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    user.verificationToken = verificationToken
    user.verificationTokenExpires = verificationTokenExpires
    await user.save()

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken)

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send verification email" })
    }

    res.status(200).json({
      success: true,
      message: "Verification email resent successfully",
    })
  } catch (error) {
    console.error("Resend verification email error:", error)
    res.status(500).json({ success: false, message: "Server error during resend verification email" })
  }
}

// Forgot password - generate reset token and send email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetTokenExpires
    await user.save()

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(user.email, user.name, resetToken)

    if (!emailSent) {
      return res.status(500).json({ success: false, message: "Failed to send password reset email" })
    }

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ success: false, message: "Server error during password reset request" })
  }
}

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password, confirmPassword } = req.body

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" })
    }

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" })
    }

    // Update password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ success: false, message: "Server error during password reset" })
  }
}

// Verify reset token (to check if token is valid before showing reset form)
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" })
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
    })
  } catch (error) {
    console.error("Verify reset token error:", error)
    res.status(500).json({ success: false, message: "Server error during token verification" })
  }
}
