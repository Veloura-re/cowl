'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      // 1. Check if we have auth params in the URL
      const hasAuthParams =
        hash.includes('access_token=') ||
        search.includes('code=');

      // 2. Check explicitly for recovery/password reset flow
      const isRecoveryFlow =
        hash.includes('type=recovery') ||
        search.includes('type=recovery') ||
        hash.includes('type=signup') || // In some cases, signup confirmation might hit here
        search.includes('type=signup');

      if (hasAuthParams) {
        console.log("Auth params detected on home page, redirecting to appropriate handler");

        // If we have auth params, and either it's explicitly recovery OR we just have a code/token
        // we should favor reset-password if we're in a "forgot password" context, 
        // but generally, if a code is present, sending it to reset-password is safer for recovery flows
        if (isRecoveryFlow || hasAuthParams) {
          // If it's a signup (confirmation), we might want to go to login or onboarding
          if (hash.includes('type=signup') || search.includes('type=signup')) {
            router.replace(`/login${hash}${search}`);
          } else {
            // Default to reset-password for codes/tokens to catch recovery flows that might drop keywords
            router.replace(`/login/reset-password${hash}${search}`);
          }
        } else {
          router.replace(`/login${hash}${search}`);
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };
    checkSession();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-transparent" />
  );
}
