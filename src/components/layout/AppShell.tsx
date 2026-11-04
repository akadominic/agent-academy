"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme";
import { cx } from "@/components/ui/primitives";
import { TutorLauncher } from "@/components/tutor/TutorPanel";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/learn", label: "Course map" },
  { href: "/anatomy", label: "Agent anatomy" },
  { href: "/labs", label: "Labs" },
  { href: "/projects", label: "Projects" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/glossary", label: "Glossary" },
  { href: "/progress", label: "Progress" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="14" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="66 22" strokeLinecap="round" transform="rotate(-40 16 16)" />
      <path d="M26.5 6.8 l1.2 5.2 -5.2 -0.6" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="4.5" fill="var(--c-model)" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  // Marks the page as interactive (used by browser tests to avoid clicking before hydration).
  useEffect(() => {
    document.documentElement.dataset.hydrated = "1";
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-raised focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-display text-[19px] font-semibold">
            <Logo className="h-7 w-7" />
            <span>Agent Academy</span>
          </Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cx(
                  "rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  isActive(n.href) ? "bg-sunken font-medium text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-sunken lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav aria-label="Main mobile" className="border-t border-line bg-bg px-4 pb-3 pt-2 lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cx("block rounded-lg px-3 py-2.5 text-[15px]", isActive(n.href) ? "bg-sunken font-medium" : "text-ink-2")}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-ink-3">
        Agent Academy · Progress is saved only in this browser · Simulated systems are always labelled
      </footer>
      <TutorLauncher />
    </div>
  );
}
