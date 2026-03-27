"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

type PrimaryAuthMode = "login" | "signup";
type AuthMode = PrimaryAuthMode | "reset";
type RegistrationStep = "details" | "verification" | "complete";

interface AuthFormProps {
  onSuccess?: (userData: { email: string; name?: string }) => void;
  onClose?: () => void;
  initialMode?: PrimaryAuthMode;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
  rememberMe: boolean;
  verificationCode: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  agreeToTerms?: string;
  general?: string;
  verificationCode?: string;
}

const calculatePasswordStrength = (password: string) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback = [
    !requirements.length && "At least 8 characters",
    !requirements.uppercase && "One uppercase letter",
    !requirements.lowercase && "One lowercase letter",
    !requirements.number && "One number",
    !requirements.special && "One special character",
  ].filter(Boolean) as string[];

  return { score, feedback };
};

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const color =
    strength.score <= 1
      ? "text-destructive"
      : strength.score <= 2
        ? "text-orange-500"
        : strength.score <= 3
          ? "text-yellow-500"
          : strength.score <= 4
            ? "text-blue-500"
            : "text-primary";
  const label =
    strength.score <= 1
      ? "Very Weak"
      : strength.score <= 2
        ? "Weak"
        : strength.score <= 3
          ? "Fair"
          : strength.score <= 4
            ? "Good"
            : "Strong";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-current", color)}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="min-w-15 text-xs text-muted-foreground">{label}</span>
      </div>
      {strength.feedback.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {strength.feedback.map((item) => (
            <div key={item} className="flex items-center gap-1 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const baseInput =
  "w-full rounded-xl border bg-muted/50 py-3 placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20";
const primaryButtonClassName =
  "w-full rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50";
const textActionButtonClassName =
  "block w-full text-center text-sm text-primary transition-colors hover:text-primary/80";
const modeToggleButtonClassName =
  "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all";

export function AuthForm({
  onSuccess,
  onClose,
  initialMode = "login",
  className,
}: AuthFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isResetMode, setIsResetMode] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>("details");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false,
    rememberMe: false,
    verificationCode: "",
  });
  const authMode: AuthMode = isResetMode ? "reset" : initialMode;

  useEffect(() => {
    setIsResetMode(false);
    if (initialMode !== "signup") setRegistrationStep("details");
  }, [initialMode]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    if (savedEmail && authMode === "login") {
      setFormData((prev) => ({ ...prev, email: savedEmail, rememberMe }));
    }
  }, [authMode]);

  const navigateToMode = useCallback(
    (mode: PrimaryAuthMode) => {
      setIsResetMode(false);
      setRegistrationStep("details");
      setErrors({});
      setSuccessMessage("");
      const target = mode === "login" ? "/login" : "/signup";
      if (pathname !== target) router.push(target);
    },
    [pathname, router],
  );

  const validateField = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      if (field === "name" && authMode === "signup" && !String(value).trim()) {
        return "Name is required";
      }
      if (field === "email") {
        if (!String(value).trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          return "Please enter a valid email address";
        }
      }
      if (field === "password") {
        if (!value) return "Password is required";
        if (String(value).length < 8) return "Password must be at least 8 characters";
        if (authMode === "signup" && calculatePasswordStrength(String(value)).score < 3) {
          return "Password is too weak";
        }
      }
      if (field === "confirmPassword" && authMode === "signup" && value !== formData.password) {
        return "Passwords do not match";
      }
      if (field === "phone" && value && !/^\+?[\d\s\-()]+$/.test(String(value))) {
        return "Please enter a valid phone number";
      }
      if (
        field === "verificationCode" &&
        authMode === "signup" &&
        registrationStep === "verification" &&
        !/^\d{6}$/.test(String(value))
      ) {
        return "Verification code must be 6 digits";
      }
      if (field === "agreeToTerms" && authMode === "signup" && !value) {
        return "You must agree to the terms and conditions";
      }
      return "";
    },
    [authMode, formData.password, registrationStep],
  );

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (fieldTouched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error || undefined }));
      }
    },
    [fieldTouched, validateField],
  );

  const handleFieldBlur = useCallback(
    (field: keyof FormData) => {
      setFieldTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(field, formData[field]);
      setErrors((prev) => ({ ...prev, [field]: error || undefined }));
    },
    [formData, validateField],
  );

  const validateForm = useCallback(() => {
    const nextErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormData)[] =
      authMode === "reset" ? ["email"] : ["email", "password"];
    if (authMode === "signup") fieldsToValidate.push("name", "confirmPassword", "agreeToTerms");
    if (registrationStep === "verification") fieldsToValidate.push("verificationCode");
    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        const errorField = field as keyof FormErrors;
        nextErrors[errorField] = error;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [authMode, formData, registrationStep, validateField]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (authMode === "login") {
        const response = await fetch("/api/signIn", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setErrors({ general: result.message || "Login failed" });
          return;
        }

        if (formData.rememberMe) {
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("userEmail");
          localStorage.removeItem("rememberMe");
        }

        setSuccessMessage("Login successful");

        onSuccess?.({ email: formData.email });

        router.push(result.redirectTo || "/dashboard");
      }
      else if (authMode === "signup" && registrationStep === "details") {
        
        const response = await fetch("/api/signup",{
          method: "POST",
          headers:{
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone
          })
        })

        const result = await response.json()

        if(!response.ok){
          setErrors({
            general: result.message || "Signup failed"
          })
          return
        }

        setRegistrationStep("verification")
        setSuccessMessage("Verification code sent to your email")

      } else if (authMode === "signup") {
        setRegistrationStep("complete");
        setSuccessMessage("Email verified successfully!");
        onSuccess?.({ email: formData.email, name: formData.name });
      } else {
        setSuccessMessage("Password reset email sent!");
        window.setTimeout(() => navigateToMode("login"), 2000);
      }
    } catch {
      setErrors({ general: "Authentication failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldError = (id: string, error?: string) =>
    error ? (
      <p id={id} className="mt-1 flex items-center gap-1 text-xs text-destructive">
        <AlertTriangle className="h-3 w-3" />
        {error}
      </p>
    ) : null;

  return (
    <div className={cn("p-6", className)} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-400/30 bg-green-500/20 p-3">
          <span className="text-sm text-green-700 dark:text-green-300">{successMessage}</span>
        </div>
      )}
      {errors.general && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/20 p-3">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{errors.general}</span>
        </div>
      )}

      <div className="mb-8 text-center">
        <h2 id="auth-title" className="mb-2 text-2xl font-bold">
          {authMode === "login" ? "Welcome Back" : authMode === "reset" ? "Reset Password" : "Create Account"}
        </h2>
        <p className="text-muted-foreground">
          {authMode === "login"
            ? "Sign in to your account"
            : authMode === "reset"
              ? "Recover your account access"
              : "Create a new account"}
        </p>
      </div>

      {authMode !== "reset" && (
        <div className="mb-6 flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => navigateToMode("login")}
            className={cn(
              modeToggleButtonClassName,
              authMode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigateToMode("signup")}
            className={cn(
              modeToggleButtonClassName,
              authMode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Sign Up
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === "reset" && (
          <>
            <div className="mb-2 text-center">
              <KeyRound className="mx-auto mb-3 h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground">
                Enter your email address and we&apos;ll send you a reset link.
              </p>
            </div>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={() => handleFieldBlur("email")}
                className={cn(baseInput, "border-input pr-4 pl-10", errors.email && "border-destructive")}
              />
              {renderFieldError("email-error", errors.email)}
            </div>
            <button
              type="submit"
              disabled={isLoading || !formData.email}
              className={primaryButtonClassName}
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><KeyRound className="h-5 w-5" />Send Reset Link</>}
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigateToMode("login")}
              className={textActionButtonClassName}
            >
              Back to Login
            </button>
          </>
        )}

        {authMode === "signup" && registrationStep === "verification" && (
          <>
            <div className="mb-2 text-center">
              <Mail className="mx-auto mb-3 h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a 6-digit code to <span className="font-medium">{formData.email}</span>
              </p>
            </div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={formData.verificationCode}
              onChange={(e) => handleInputChange("verificationCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              onBlur={() => handleFieldBlur("verificationCode")}
              maxLength={6}
              className={cn(baseInput, "border-input px-4 text-center font-mono text-2xl tracking-widest", errors.verificationCode && "border-destructive")}
            />
            {renderFieldError("code-error", errors.verificationCode)}
            <button
              type="submit"
              disabled={isLoading || formData.verificationCode.length !== 6}
              className={primaryButtonClassName}
            >
              {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify Email"}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationStep("details")}
              className={textActionButtonClassName}
            >
              Back to Details
            </button>
          </>
        )}

        {authMode === "signup" && registrationStep === "complete" && (
          <div className="space-y-6 py-4 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h3 className="mb-2 text-2xl font-bold">Welcome Aboard!</h3>
              <p className="text-muted-foreground">Your account has been created successfully.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={primaryButtonClassName}
            >
              Get Started
            </button>
          </div>
        )}

        {((authMode === "login") || (authMode === "signup" && registrationStep === "details")) && (
          <>
            {authMode === "signup" && (
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  className={cn(baseInput, "border-input pr-4 pl-10", errors.name && "border-destructive")}
                />
                {renderFieldError("name-error", errors.name)}
              </div>
            )}

            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={() => handleFieldBlur("email")}
                className={cn(baseInput, "border-input pr-4 pl-10", errors.email && "border-destructive")}
              />
              {renderFieldError("email-error", errors.email)}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onBlur={() => handleFieldBlur("password")}
                  className={cn(baseInput, "border-input pr-12 pl-10", errors.password && "border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {renderFieldError("password-error", errors.password)}
              {authMode === "signup" && <PasswordStrengthIndicator password={formData.password} />}
            </div>

            {authMode === "signup" && (
              <>
                <div className="relative">
                  <Shield className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    onBlur={() => handleFieldBlur("confirmPassword")}
                    className={cn(baseInput, "border-input pr-12 pl-10", errors.confirmPassword && "border-destructive")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  {renderFieldError("confirm-password-error", errors.confirmPassword)}
                </div>

                <div className="relative">
                  <Phone className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onBlur={() => handleFieldBlur("phone")}
                    className={cn(baseInput, "border-input pr-4 pl-10", errors.phone && "border-destructive")}
                  />
                  {renderFieldError("phone-error", errors.phone)}
                </div>
              </>
            )}

            <div className="flex items-center justify-between gap-4">
              {authMode === "login" ? (
                <>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
                      className="h-4 w-4 rounded border-input bg-muted text-primary"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-sm text-primary transition-colors hover:text-primary/80"
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input bg-muted text-primary"
                  />
                  <span>
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>
              )}
            </div>

            {errors.agreeToTerms && renderFieldError("terms-error", errors.agreeToTerms)}

            <button
              type="submit"
              disabled={isLoading}
              className={primaryButtonClassName}
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : authMode === "login" ? "Sign In" : "Create Account"}
              </span>
            </button>
          </>
        )}
      </form>

      {authMode !== "reset" && registrationStep === "details" && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => navigateToMode(authMode === "login" ? "signup" : "login")}
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            {authMode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      )}
    </div>
  );
}
