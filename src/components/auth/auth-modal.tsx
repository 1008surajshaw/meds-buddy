"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Users, Mail, CheckCircle } from "lucide-react"
import type { UserRole } from "@/types/type"
import { useAuth } from "@/context/AuthContext"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRole?: UserRole
}

type AuthMode = "signin" | "signup" | "email-sent"

export const AuthModal = ({ open, onOpenChange, defaultRole = "patient" }: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>("signin")
  const [role, setRole] = useState<UserRole>(defaultRole)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    })
    setError(null)
  }

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === "signup") {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match")
        }
        if (formData.name.trim().length < 2) {
          throw new Error("Name must be at least 2 characters long")
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters long")
        }

        await signUp(formData.email, formData.password, formData.name.trim(), role)

        // If we get here without error, either the user is signed in or needs email confirmation
        // The hook will handle the appropriate state
        onOpenChange(false)
        resetForm()
      } else {
        await signIn(formData.email, formData.password)
        onOpenChange(false)
        resetForm()
      }
    } catch (error: any) {
      if (error.message.includes("email")) {
        setMode("email-sent")
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  if (mode === "email-sent") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Check Your Email
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-6">
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Confirmation Email Sent</h3>
            <p className="text-muted-foreground mb-4">
              We've sent a confirmation link to <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your email and click the confirmation link to complete your registration.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleModeSwitch("signin")} className="flex-1">
              Back to Sign In
            </Button>
            <Button onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role === "patient" ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            {mode === "signin" ? "Sign In" : "Create Account"} as {role === "patient" ? "Patient" : "Caretaker"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>I am a:</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={role === "patient" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRole("patient")}
                    className="flex-1"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Patient
                  </Button>
                  <Button
                    type="button"
                    variant={role === "caretaker" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRole("caretaker")}
                    className="flex-1"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Caretaker
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange("password")}
              required
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange("confirmPassword")}
                required
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => handleModeSwitch(mode === "signin" ? "signup" : "signin")}
              className="text-sm"
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
