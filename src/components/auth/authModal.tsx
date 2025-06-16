
import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Users, Mail, CheckCircle, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { toast } from "sonner"
import type { UserRole } from "@/types/type"
import { useAuth } from "@/context/AuthContext"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRole?: UserRole
}

type AuthMode = "signin" | "signup" | "email-sent"

interface FormErrors {
  email?: string
  password?: string
  name?: string
  confirmPassword?: string
  general?: string
}

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
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { signIn, signUp } = useAuth()

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    })
    setErrors({})
  }

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode)
    resetForm()
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email is required"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password is required"
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long"
    }
    if (password.length > 128) {
      return "Password must be less than 128 characters"
    }
    
    return undefined
  }

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Full name is required"
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long"
    }
    if (name.trim().length > 50) {
      return "Name must be less than 50 characters"
    }
    return undefined
  }

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) {
      return "Please confirm your password"
    }
    if (password !== confirmPassword) {
      return "Passwords do not match"
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    const emailError = validateEmail(formData.email)
    if (emailError) newErrors.email = emailError

    // Password validation
    const passwordError = validatePassword(formData.password)
    if (passwordError) newErrors.password = passwordError

    // Name validation (only for signup)
    if (mode === "signup") {
      const nameError = validateName(formData.name)
      if (nameError) newErrors.name = nameError

      // Confirm password validation
      const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword)
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form", {
        description: "Check all required fields and try again",
      })
      return
    }

    setLoading(true)

    try {
      if (mode === "signup") {
        await signUp(formData.email, formData.password, formData.name.trim(), role)

        toast.success("Account created successfully!", {
          description: `Welcome to MedsBuddy, ${formData.name}!`,
        })

        onOpenChange(false)
        resetForm()
      } else {
        await signIn(formData.email, formData.password)

        toast.success("Welcome back!", {
          description: "You have successfully signed in to your account",
        })

        onOpenChange(false)
        resetForm()
      }
    } catch (error: any) {
      console.error("Auth error:", error)

      // Handle specific error messages
      let errorMessage = error.message || "An unexpected error occurred"
      let toastTitle = "Authentication Error"

      if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid email or password")) {
        errorMessage = "Invalid email or password. Please check your credentials and try again."
        toastTitle = "Wrong Password"

        toast.error(toastTitle, {
          description: "The email or password you entered is incorrect",
        })

        setErrors({ general: errorMessage })
      } else if (error.message.includes("Email not confirmed")) {
        setMode("email-sent")

        toast.info("Email confirmation required", {
          description: "Please check your email and click the confirmation link",
        })
        return
      } else if (error.message.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead."

        toast.error("Account Already Exists", {
          description: "Try signing in instead or use a different email address",
        })

        setErrors({ general: errorMessage })
      } else if (error.message.includes("Password should be at least 6 characters")) {
        toast.error("Password Too Short", {
          description: "Password must be at least 6 characters long",
        })

        setErrors({ password: "Password must be at least 6 characters long" })
        return
      } else if (error.message.includes("Unable to validate email address")) {
        toast.error("Invalid Email", {
          description: "Please enter a valid email address",
        })

        setErrors({ email: "Please enter a valid email address" })
        return
      } else if (error.message.includes("email")) {
        setMode("email-sent")

        toast.info("Check Your Email", {
          description: "We've sent you a confirmation link",
        })
        return
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        toast.error("Connection Error", {
          description: "Please check your internet connection and try again",
        })
      } else {
        toast.error("Something went wrong", {
          description: errorMessage,
        })
      }

      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    // Clear general error when user makes changes
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }))
    }
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
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  className={errors.name ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
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
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange("email")}
              className={errors.email ? "border-red-500 focus:border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange("password")}
                className={errors.password ? "border-red-500 focus:border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
            {mode === "signup" && !errors.password && (
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters and contain at least one letter
              </p>
            )}
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  className={errors.confirmPassword ? "border-red-500 focus:border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
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
