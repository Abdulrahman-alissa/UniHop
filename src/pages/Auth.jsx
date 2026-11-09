
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  GraduationCap,
  Info,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { useStore } from "../store";
import { CAMPUSES, DEMO, GENDERS } from "../data";
import { Button } from "../components/Button";
import { CampusPicker, CheckboxRow, TextInput } from "../components/Field";
import Logo from "../components/Logo";
import CampusPhoto from "../components/CampusPhoto";
import { cn } from "../lib/cn";

const LAU_EMAIL = /^[^\s@]+@lau\.edu$/i;

export default function Auth({ initialMode }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const { login, register, currentUser, logout, toast } = useStore();

  const [mode, setMode] = useState(
    initialMode ||
      (params.get("mode") === "register" ? "register" : "login")
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    campus: "",
    gender: "",
    terms: false,
  });

  const isRegister = mode === "register";
  const next = params.get("next")?.startsWith("/")
    ? params.get("next")
    : "/dashboard";

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setFormError("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setFormError("");
  };

  const passwordStrength = (() => {
    const password = form.password;

    if (!password) {
      return { score: 0, label: "Enter a password" };
    }

    const score = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    return {
      score,
      label: ["Very weak", "Weak", "Fair", "Strong", "Excellent"][score],
    };
  })();

  const submit = (event) => {
    event.preventDefault();

    const validationErrors = {};

    if (isRegister && form.name.trim().length < 3) {
      validationErrors.name = "Enter your full name.";
    }

    if (!form.email.trim()) {
      validationErrors.email = "Enter your LAU email address.";
    } else if (!LAU_EMAIL.test(form.email.trim())) {
      validationErrors.email = "Use your @lau.edu address.";
    }

    if (isRegister) {
      if (form.password.length < 8) {
        validationErrors.password = "Use at least 8 characters.";
      } else if (
        !/[A-Za-z]/.test(form.password) ||
        !/[0-9]/.test(form.password)
      ) {
        validationErrors.password = "Mix letters and numbers.";
      }

      if (form.confirm !== form.password) {
        validationErrors.confirm = "The passwords don't match.";
      }

      if (!form.campus) {
        validationErrors.campus = "Choose your LAU campus.";
      }

      if (!form.gender) {
        validationErrors.gender = "Choose girl or boy.";
      }

      if (!form.terms) {
        validationErrors.terms = "Please accept the ride rules.";
      }
    } else if (!form.password) {
      validationErrors.password = "Enter your password.";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFormError("");
      return;
    }

    const result = isRegister
      ? register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          campus: form.campus,
          gender: form.gender,
        })
      : login(form.email.trim(), form.password);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    toast(
      "success",
      isRegister ? "Account created" : "Welcome back",
      "You're signed in to the UniHop ride board."
    );

    navigate(next, { replace: true });
  };

  const fillDemo = () => {
    setForm((previous) => ({
      ...previous,
      email: DEMO.email,
      password: DEMO.password,
    }));
    setErrors({});
    setFormError("");
  };

  const brand = (
    <Link
      to="/"
      aria-label="UniHop home"
      className="inline-flex min-w-0 max-w-full items-center gap-3 rounded-xl"
    >
      <span className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden sm:h-14 sm:w-16">
        <Logo className="h-full w-full object-contain" />
      </span>

      <span className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        UniHop
      </span>
    </Link>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        {/* Desktop branding panel */}
        <aside className="relative isolate hidden min-w-0 flex-col justify-between overflow-hidden bg-hero p-8 text-white sm:p-10 lg:flex">
          <CampusPhoto campus="LAU Beirut" className="-z-20" />

          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-br from-[#07281f]/95 via-[#0b4a38]/90 to-[#07281f]/95"
          />

          <div>{brand}</div>

          <div className="py-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Your campus. Your community.
            </p>

            <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight xl:text-5xl">
              One account.
              <br />
              Two campuses.
              <br />
              Every free seat.
            </h2>

            <p className="mt-5 max-w-sm leading-7 text-white/80">
              Connect with fellow LAU students, find rides between campuses,
              and share travel costs with your university community.
            </p>

            <ul className="mt-8 space-y-5">
              {[
                [ShieldCheck, "Student-focused ride sharing"],
                [GraduationCap, "Beirut and Byblos routes"],
                [Lock, "Drivers manage their own rides"],
              ].map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Icon
                      className="h-5 w-5 text-accent"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-sm font-medium text-white/90">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-white/60">
            Rides by students, for students.
          </p>
        </aside>

        {/* Form section */}
        <section className="min-w-0 px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile branding */}
            <div className="relative isolate mb-7 overflow-hidden rounded-2xl bg-hero p-5 text-white sm:p-6 lg:hidden">
              <CampusPhoto campus="LAU Byblos" className="-z-20" />

              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07281f]/95 to-[#0b4a38]/85"
              />

              {brand}

              <p className="mt-4 max-w-xs text-sm leading-6 text-white/80">
                Your campus rides, made simpler.
              </p>
            </div>

            {/* Existing session */}
            {currentUser && (
              <div className="mb-6 rounded-2xl border border-border bg-secondary/50 p-4 sm:p-5">
                <p className="flex items-start gap-2 font-semibold">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <span>
                    Signed in as{" "}
                    <strong className="break-words">{currentUser.name}</strong>
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate("/dashboard")}>
                    Open dashboard
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      logout();
                      toast("info", "Signed out");
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-bold text-accent-strong">
                WELCOME TO UNI HOP
              </p>

              <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                {isRegister
                  ? "Create your student account"
                  : "Welcome back"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                {isRegister
                  ? "Join your LAU community and start sharing rides."
                  : "Sign in with your LAU email to access your rides."}
              </p>
            </div>

            {/* Login / registration tabs */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1"
            >
              {[
                ["login", "Sign in"],
                ["register", "Create account"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={mode === key}
                  onClick={() => switchMode(key)}
                  className={cn(
                    "min-h-11 rounded-lg px-2 text-sm font-bold transition sm:text-base",
                    mode === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {formError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                {formError}
              </p>
            )}

            <form onSubmit={submit} noValidate className="mt-6 space-y-4">
              {isRegister && (
                <TextInput
                  id="name"
                  label="Full name"
                  autoComplete="name"
                  placeholder="e.g. name"
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  error={errors.name}
                />
              )}

              <TextInput
                id="email"
                label="LAU email address"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@lau.edu"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                error={errors.email}
              />

              {isRegister && (
                <>
                  <div>
                    <span className="mb-1.5 block text-sm font-semibold">
                      Campus
                    </span>

                    <CampusPicker
                      options={CAMPUSES}
                      value={form.campus}
                      onChange={(value) => updateField("campus", value)}
                      label="Campus"
                    />

                    {errors.campus && (
                      <p
                        role="alert"
                        className="mt-1.5 text-sm font-medium text-destructive"
                      >
                        {errors.campus}
                      </p>
                    )}
                  </div>

                  <fieldset>
                    <legend className="mb-1.5 text-sm font-semibold">
                      I am a
                    </legend>

                    <div
                      role="radiogroup"
                      aria-label="Gender"
                      className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1"
                    >
                      {GENDERS.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={form.gender === value}
                          onClick={() => updateField("gender", value)}
                          className={cn(
                            "min-h-11 rounded-lg font-bold transition",
                            form.gender === value
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {errors.gender && (
                      <p
                        role="alert"
                        className="mt-1.5 text-sm font-medium text-destructive"
                      >
                        {errors.gender}
                      </p>
                    )}
                  </fieldset>
                </>
              )}

              <TextInput
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  isRegister ? "new-password" : "current-password"
                }
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                error={errors.password}
                accessory={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="min-h-8 rounded px-1 text-sm font-bold text-accent-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                }
                hint={
                  isRegister
                    ? "At least 8 characters, including letters and numbers."
                    : undefined
                }
              />

              {isRegister && (
                <>
                  {form.password && (
                    <div aria-live="polite" className="pt-1">
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((index) => (
                          <span
                            key={index}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors",
                              index < passwordStrength.score
                                ? passwordStrength.score >= 3
                                  ? "bg-success"
                                  : "bg-accent"
                                : "bg-border"
                            )}
                          />
                        ))}
                      </div>

                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Password strength: {passwordStrength.label}
                      </p>
                    </div>
                  )}

                  <TextInput
                    id="confirm"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={(event) =>
                      updateField("confirm", event.target.value)
                    }
                    error={errors.confirm}
                  />

                  <div>
                    <CheckboxRow
                      id="terms"
                      label="I accept the UniHop ride rules"
                      description="Share the agreed fare, be on time, and respect each driver's car."
                      checked={form.terms}
                      onChange={(event) =>
                        updateField("terms", event.target.checked)
                      }
                    />

                    {errors.terms && (
                      <p
                        role="alert"
                        className="mt-1 text-sm font-medium text-destructive"
                      >
                        {errors.terms}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  fullWidth
                >
                  {isRegister ? "Create account" : "Sign in"}
                </Button>
              </div>
            </form>

            {/* Demo account */}
            {!isRegister && (
              <div className="mt-6 rounded-xl border border-dashed border-accent/50 bg-accent-soft/50 p-4">
                <p className="flex items-start gap-2 text-sm leading-6">
                  <Info
                    className="mt-1 h-4 w-4 shrink-0 text-accent-strong"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>Want to try UniHop?</strong>
                    <br />
                    Use the demo account to explore the ride board.
                  </span>
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="mt-3"
                  onClick={fillDemo}
                >
                  Fill demo credentials
                </Button>
              </div>
            )}

            <p className="mt-6 text-center text-sm leading-6 text-muted-foreground">
              Prefer to look around?{" "}
              <Link
                to="/rides"
                className="font-bold text-accent-strong underline underline-offset-4"
              >
                Browse rides
              </Link>
            </p>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              UniHop · Rides by students, for students.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}