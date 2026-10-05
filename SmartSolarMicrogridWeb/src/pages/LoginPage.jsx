import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";

const DASHBOARD_BY_ROLE = {
    Backoffice: "/backoffice",
    GridOperator: "/operator",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REMEMBERED_EMAIL_KEY = "rememberedEmail";

const HIGHLIGHTS = [
    "Balance solar generation, battery storage and grid demand in real time.",
    "Register microgrid hubs, onboard prosumers and approve their accounts.",
    "Plan and dispatch energy reservations from a single operations view.",
];

const ROLE_CHIPS = [
    { role: "Backoffice", destination: "Backoffice console" },
    { role: "GridOperator", destination: "Operator console" },
];

// Icons are inlined because the project has no icon library installed.
function BrandMark({ className = "h-11 w-11" }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
            <rect width="48" height="48" rx="14" className="fill-primary" />
            <path
                d="M27.5 10 15 27.5h7L20.5 38 33 20.5h-7L27.5 10Z"
                className="fill-white"
            />
            <circle cx="37" cy="11" r="4" className="fill-secondary" />
        </svg>
    );
}

// Envelope icon for the email field.
function MailIcon({ className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
            <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
            <path d="m3.5 7 7.3 5.2a2 2 0 0 0 2.4 0L20.5 7" strokeLinecap="round" />
        </svg>
    );
}

// Padlock icon for the password field.
function LockIcon({ className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
            <rect x="4.5" y="10" width="15" height="10.5" rx="3" />
            <path d="M8.25 10V7.75a3.75 3.75 0 0 1 7.5 0V10" strokeLinecap="round" />
        </svg>
    );
}

// Eye icon for the show/hide password toggle.
function EyeIcon({ open, className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
            <path d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
            {open && <path d="m4 20 16-16" strokeLinecap="round" />}
        </svg>
    );
}

// Warning icon for error messages.
function AlertIcon({ className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.25" strokeLinecap="round" />
            <circle cx="12" cy="16.25" r="0.9" className="fill-current" stroke="none" />
        </svg>
    );
}

// Tick icon.
function CheckIcon({ className = "h-4 w-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={className} aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// Labelled input wrapper with an optional hint, icon and error message.
function Field({ id, label, hint, icon, error, children }) {
    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between">
                <label htmlFor={id} className="text-sm font-semibold text-foreground">
                    {label}
                </label>
                {hint && <span className="text-xs text-muted">{hint}</span>}
            </div>
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted transition-colors peer-focus:text-secondary">
                    {icon}
                </span>
                {children}
            </div>
            {error && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <AlertIcon className="h-3.5 w-3.5" />
                    {error}
                </p>
            )}
        </div>
    );
}

// Staff login page.
function LoginPage() {
    const [email, setEmail] = useState(() => localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY)));
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Returns the first problem with the entered email or password, or an empty string.
    function validate() {
        if (!email.trim()) return "Enter the email address registered with the microgrid.";
        if (!EMAIL_PATTERN.test(email.trim())) return "That email address does not look valid.";
        if (!password) return "Enter your password to continue.";
        return "";
    }

    // Validates the form, signs in and opens the dashboard for the user's role.
    async function handleSubmit(e) {
        e.preventDefault(); // stop the page reload

        if (isSubmitting) return;

        const validationError = validate();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const result = await login(email.trim(), password);

            if (rememberMe) {
                localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
            } else {
                localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            }

            // Unknown roles (e.g. a Prosumer with no console yet) stay on this page.
            const destination = DASHBOARD_BY_ROLE[result.role];
            if (destination) {
                navigate(destination);
            } else {
                setErrorMessage(`Signed in as ${result.role}, but no console is available for this role yet.`);
            }
        } catch (err) {
            setErrorMessage(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
            {/* Brand panel */}
            <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-secondary lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div
                    className="absolute inset-0 opacity-25"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                    aria-hidden="true"
                />
                <div className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-float" aria-hidden="true" />
                <div className="absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-secondary/40 blur-3xl" aria-hidden="true" />

                <div className="relative flex items-center gap-3 text-white">
                    <BrandMark />
                    <div>
                        <p className="text-lg font-bold leading-tight">Smart Solar Microgrid</p>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">Energy Operations</p>
                    </div>
                </div>

                <div className="relative max-w-lg text-white">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-inset ring-white/30 backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        Microgrid control centre
                    </span>
                    <h1 className="mt-6 text-4xl font-bold leading-tight xl:text-5xl">
                        Power the neighbourhood, intelligently.
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-white/85">
                        One workspace to monitor generation, coordinate prosumer energy and keep every
                        reservation on track.
                    </p>

                    <ul className="mt-10 space-y-4">
                        {HIGHLIGHTS.map((highlight) => (
                            <li key={highlight} className="flex items-start gap-3 text-white/90">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-inset ring-white/30">
                                    <CheckIcon />
                                </span>
                                <span className="text-sm leading-relaxed">{highlight}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative flex items-center gap-2 text-sm text-white/75">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    Role-based access &middot; Backoffice &amp; Grid Operator
                </div>
            </aside>

            {/* Form panel */}
            <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 sm:py-16">
                <div className="w-full max-w-md animate-rise">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <BrandMark />
                        <div>
                            <p className="font-bold leading-tight text-foreground">Smart Solar Microgrid</p>
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Energy Operations</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-surface p-6 shadow-xl shadow-slate-200/60 sm:p-9">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-10 rounded-full bg-primary" />
                            <span className="h-1.5 w-4 rounded-full bg-secondary" />
                        </div>
                        <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
                        <p className="mt-2 text-sm text-muted">
                            Sign in with your operations account to open your console.
                        </p>

                        {errorMessage && (
                            <div
                                role="alert"
                                className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
                            >
                                <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                            <Field id="email" label="Email address" icon={<MailIcon />}>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrorMessage("");
                                    }}
                                    placeholder="you@smartgrid.io"
                                    autoComplete="email"
                                    autoFocus
                                    aria-invalid={Boolean(errorMessage)}
                                    className="w-full rounded-xl border border-slate-200 bg-background py-3 pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus:border-secondary focus:bg-surface focus:ring-4 focus:ring-secondary/15"
                                />
                            </Field>

                            <Field id="password" label="Password" icon={<LockIcon />} hint="At least 8 characters">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setErrorMessage("");
                                    }}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    aria-invalid={Boolean(errorMessage)}
                                    className="w-full rounded-xl border border-slate-200 bg-background py-3 pl-11 pr-12 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus:border-secondary focus:bg-surface focus:ring-4 focus:ring-secondary/15"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute inset-y-0 right-2 flex items-center px-2 text-muted transition-colors hover:text-secondary"
                                >
                                    <EyeIcon open={showPassword} />
                                </button>
                            </Field>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-muted">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-secondary accent-secondary focus:ring-2 focus:ring-secondary/30"
                                    />
                                    Remember my email
                                </label>
                                <p className="text-xs text-muted">Forgot your password? Contact your administrator.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group relative w-full overflow-hidden rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-foreground shadow-glow-primary transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                <span className="relative inline-flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
                                            Signing in&hellip;
                                        </>
                                    ) : (
                                        <>
                                            Sign in
                                            <span aria-hidden="true">&rarr;</span>
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        <div className="mt-6 text-center text-xs text-muted">
                            Are you a solar prosumer?{" "}
                            <Link to="/register" className="font-bold text-primary hover:underline">
                                Register your solar node
                            </Link>{" "}
                            or{" "}
                            <Link to="/" className="font-bold text-slate-700 hover:underline">
                                View homepage
                            </Link>
                        </div>

                        <div className="mt-6 rounded-xl border border-slate-200 bg-background p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                                Where do I land?
                            </p>
                            <ul className="mt-3 space-y-2">
                                {ROLE_CHIPS.map(({ role, destination }) => (
                                    <li key={role} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="inline-flex items-center gap-2 font-medium text-foreground">
                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    role === "Backoffice" ? "bg-primary" : "bg-secondary"
                                                }`}
                                            />
                                            {role}
                                        </span>
                                        <span className="text-xs text-muted">{destination}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-muted">
                        &copy; {new Date().getFullYear()} Smart Solar Microgrid. Authorised personnel only.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default LoginPage;
