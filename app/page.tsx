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
        search.includes('code=') ||
        hash.includes('type=recovery');

      if (hasAuthParams) {
        console.log("Auth params detected on home page, redirecting to appropriate handler");

        // Check if it's a recovery/password reset flow
        // PKCE links usually have ?code= and may have &type=recovery in query or hash
        const isRecoveryFlow =
          hash.includes('type=recovery') ||
          search.includes('type=recovery');

        if (isRecoveryFlow) {
          router.replace(`/login/reset-password${hash}${search}`);
        } else {
          // Otherwise send to login page to handle the authentication/redirection
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
