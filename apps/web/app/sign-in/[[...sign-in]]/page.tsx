import { SignInScreen } from "@/components/auth/sign-in-screen";

export default function SignInPage() {
  const authConfigured =
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    Boolean(process.env.CLERK_SECRET_KEY);

  return <SignInScreen configured={authConfigured} />;
}
