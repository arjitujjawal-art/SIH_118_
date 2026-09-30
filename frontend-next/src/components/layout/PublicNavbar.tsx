"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldAlert, ArrowRight } from "lucide-react";
import { PROJECT_NAME } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

export default function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className={`fixed top-0 left-0 right-0 h-20 z-50 flex items-center px-6 lg:px-12 transition-all ${
      pathname === "/working"
        ? "bg-transparent border-transparent"
        : "bg-white/90 backdrop-blur-md border-b border-light-surface"
    }`}>
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-3xl tracking-tight uppercase text-charcoal flex items-center">
            {PROJECT_NAME}
            <span className="text-yellow-golden text-4xl leading-none">.</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded bg-sage-light/50 text-sage-muted">
            Passive Dosimeter
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/" ? "text-teal-deep font-semibold" : "text-sage-muted hover:text-charcoal"
            }`}
          >
            Home
          </Link>
          <Link
            href="/working"
            className={`text-sm font-medium transition-colors ${
              pathname === "/working" ? "text-teal-deep font-semibold" : "text-sage-muted hover:text-charcoal"
            }`}
          >
            Pipeline
          </Link>
          <a
            href="/#team"
            className="text-sm font-medium text-sage-muted hover:text-charcoal transition-colors"
          >
            Team
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-charcoal hover:text-teal-deep px-4 py-2 transition-colors"
          >
            Login
          </Link>
          <Link
            href={user?.authenticated ? (user.role === "MANAGER" ? "/manager" : user.role === "HSE_OFFICER" ? "/control-room" : `/workers/${user.employee_id || "EMP-1042"}`) : "/login"}
            className="inline-flex items-center gap-2 bg-charcoal text-white hover:bg-black font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-300 shadow-sm hover:shadow group"
          >
            <span>Open Platform</span>
            <ArrowRight className="w-4 h-4 text-yellow-golden group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-charcoal hover:text-teal-deep rounded-lg"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-light-surface px-6 py-6 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`text-base py-2 ${pathname === "/" ? "text-teal-deep font-semibold" : "text-charcoal"}`}
          >
            Home
          </Link>
          <Link
            href="/working"
            onClick={() => setMobileOpen(false)}
            className={`text-base py-2 ${pathname === "/working" ? "text-teal-deep font-semibold" : "text-charcoal"}`}
          >
            Pipeline
          </Link>
          <a
            href="/#team"
            onClick={() => setMobileOpen(false)}
            className="text-base py-2 text-charcoal"
          >
            Team
          </a>
          <div className="pt-4 border-t border-light-surface flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center py-2.5 font-medium border border-charcoal/20 rounded-lg text-charcoal"
            >
              Login
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center py-2.5 bg-charcoal text-white font-medium rounded-full shadow"
            >
              Open Platform
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
