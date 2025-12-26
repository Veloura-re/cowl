import Link from "next/link";
import { ArrowRight, Hexagon, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] overflow-hidden relative selection:bg-[var(--primary)] selection:text-[var(--background)]">

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)]/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <div className="text-[var(--primary)]">
              <Hexagon className="h-8 w-8 fill-current" />
            </div>
            <span>LUCY</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors">
              Login
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 bg-[var(--primary)] text-[var(--background)] px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[var(--primary-hover)] transition-all shadow-[0_0_20px_-5px_var(--primary)]"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--surface-highlight)] bg-[var(--surface)] text-[var(--primary)] text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <Zap className="h-4 w-4 fill-current" />
            <span>The Business OS for winners</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight max-w-4xl mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Manage your empire with <span className="text-[var(--primary)]">absolute precision</span>.
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            LUCY is the all-in-one platform for sales, inventory, and finance.
            Designed for speed, built for control, and styled for those who demand excellence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-[var(--text-main)] text-[var(--background)] px-8 py-4 rounded-lg text-base font-bold hover:bg-[var(--primary)] hover:text-[var(--background)] transition-all"
            >
              Start for Free
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 border border-[var(--surface-highlight)] bg-[var(--surface)] text-[var(--text-main)] px-8 py-4 rounded-lg text-base font-medium hover:border-[var(--primary)] transition-all"
            >
              Live Demo
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            {[
              { title: 'Inventory Control', icon: Hexagon, desc: 'Real-time tracking of every stock item with low-stock alerts.' },
              { title: 'Smart Invoicing', icon: Zap, desc: 'Create beautiful invoices in seconds and track payments automatically.' },
              { title: 'Secure Finance', icon: ShieldCheck, desc: 'Bank-grade security for your financial data and transaction history.' }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl border border-[var(--surface-highlight)] bg-[var(--surface)] hover:border-[var(--primary)]/50 transition-colors text-left group">
                <div className="h-12 w-12 rounded-lg bg-[var(--surface-highlight)] flex items-center justify-center mb-6 group-hover:bg-[var(--primary)] group-hover:text-[var(--background)] transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--text-main)]">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </main>

        <footer className="container mx-auto px-6 py-12 border-t border-[var(--surface-highlight)] mt-12 text-center text-[var(--text-muted)] text-sm">
          <p>&copy; {new Date().getFullYear()} LUCY Business OS. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
