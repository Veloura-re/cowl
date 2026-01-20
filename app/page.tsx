'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Hexagon, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen text-[var(--foreground)] overflow-hidden relative selection:bg-[var(--primary-green)] selection:text-white">

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Navigation - Compact */}
        <nav className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-lg tracking-tighter">
            <div className="text-[var(--primary-green)]">
              <Hexagon className="h-5 w-5 fill-current" />
            </div>
            <span className="text-[var(--deep-contrast)]">LUCY</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)] opacity-50 hover:opacity-100 transition-opacity">
              Login
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 bg-[var(--deep-contrast)] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--primary-green)] transition-all shadow-lg active:scale-95"
            >
              Get Started <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </nav>

        {/* Hero Section - Compact */}
        <main className="px-6 py-12 lg:py-20 flex flex-col items-center text-center">
          <div className="glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[var(--primary-green)] text-[9px] font-bold uppercase tracking-[0.2em] mb-6 border border-white/40 shadow-sm">
            <Zap className="h-3 w-3 fill-current" />
            <span>The Business OS</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight max-w-2xl mb-4 text-[var(--deep-contrast)] uppercase leading-[1.1]">
            Manage your empire with <span className="text-[var(--primary-green)] underline decoration-4 decoration-[var(--primary-green)]/20 underline-offset-4">absolute precision</span>.
          </h1>

          <p className="text-xs font-bold text-[var(--foreground)]/50 uppercase tracking-widest max-w-lg mb-8 leading-relaxed">
            All-in-one platform for sales, inventory, and finance.
            Built for speed, styled for excellence.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-[var(--deep-contrast)] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[var(--primary-green)] transition-all shadow-xl active:scale-95"
            >
              Start for Free
            </Link>
            <Link
              href="/login"
              className="glass flex items-center justify-center gap-2 text-[var(--deep-contrast)] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/60 transition-all border border-white/40"
            >
              Live Demo
            </Link>
          </div>

          {/* Feature Grid - Ultra Compact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-16 w-full max-w-4xl">
            {[
              { title: 'Inventory Control', icon: Hexagon, desc: 'Real-time tracking with low-stock alerts.' },
              { title: 'Smart Invoicing', icon: Zap, desc: 'Create beautiful invoices in seconds.' },
              { title: 'Secure Finance', icon: ShieldCheck, desc: 'Bank-grade security for your empire.' }
            ].map((feature, i) => (
              <div key={i} className="glass p-5 rounded-3xl hover:border-[var(--primary-green)]/30 transition-all text-left group border border-white/40 shadow-sm hover:shadow-md">
                <div className="h-9 w-9 rounded-xl bg-[var(--primary-green)]/10 text-[var(--primary-green)] flex items-center justify-center mb-3 group-hover:bg-[var(--primary-green)] group-hover:text-white transition-colors shadow-inner">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold mb-1.5 text-[var(--deep-contrast)] uppercase tracking-tight">{feature.title}</h3>
                <p className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-tight leading-normal">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </main>

        <footer className="px-6 py-8 border-t border-[var(--primary-green)]/5 mt-8 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--foreground)]/30">
            &copy; {new Date().getFullYear()} LUCY Business OS
          </p>
        </footer>
      </div>
    </div>
  );
}
