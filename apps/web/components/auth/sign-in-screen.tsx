import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

type SignInScreenProps = Readonly<{ configured: boolean }>;

export function SignInScreen({ configured }: SignInScreenProps) {
  return (
    <main className="auth-page" id="main-content">
      <div className="auth-layout">
        <div className="auth-brand-lockup">
          <span className="auth-brand-mark" aria-hidden="true">
            C
          </span>
          <span>Cadence</span>
        </div>

        <section className="auth-card" aria-labelledby="sign-in-title">
          <div className="auth-intro">
            <p className="auth-eyebrow">A quieter way to create</p>
            <h1 id="sign-in-title">Welcome back.</h1>
            <p>Sign in to your private Cadence workspace.</p>
          </div>

          {configured ? (
            <SignIn
              path="/sign-in"
              routing="path"
              forceRedirectUrl="/"
              signUpUrl="/access-denied"
              appearance={{
                variables: {
                  colorPrimary: "var(--color-action)",
                  colorBackground: "var(--color-surface)",
                  colorForeground: "var(--color-text)",
                  colorMutedForeground: "var(--color-subtle)",
                  colorInput: "var(--color-surface)",
                  colorInputForeground: "var(--color-text)",
                  borderRadius: "0.5rem",
                  fontFamily: "var(--font-ui)",
                },
                elements: {
                  rootBox: "clerk-auth-root",
                  card: "clerk-auth-card",
                  header: "clerk-auth-header",
                  headerTitle: "clerk-auth-header-title",
                  headerSubtitle: "clerk-auth-header-subtitle",
                  socialButtonsBlockButton: "clerk-auth-social-button",
                  formButtonPrimary: "clerk-auth-primary-button",
                  formFieldInput: "clerk-auth-input",
                  formFieldLabel: "clerk-auth-label",
                  footer: "clerk-auth-footer",
                  footerAction: "clerk-auth-footer-action",
                },
              }}
            />
          ) : (
            <div className="auth-setup-state" role="status">
              <strong>Sign-in is being prepared.</strong>
              <p>
                Authentication is not configured for this environment. No
                workspace information is available here.
              </p>
            </div>
          )}

          <p className="auth-privacy-note">
            Workspace access is invitation-only. Your private captures stay
            visible only to you until you choose to share them.
          </p>
        </section>

        <footer className="auth-footer">
          <span>Thoughtful by design. Private by default.</span>
          <Link href="/access-denied">Access guidance</Link>
        </footer>
      </div>
    </main>
  );
}
