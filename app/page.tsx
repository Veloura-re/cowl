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
      // 1. Check if we have auth params in the URL (processing a login/redirect)
      const hasAuthParams =
        window.location.hash.includes('access_token=') ||
        window.location.search.includes('code=') ||
        window.location.hash.includes('type=recovery');

      if (hasAuthParams) {
        console.log("Auth params detected on home page, skipping immediate redirect");
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
