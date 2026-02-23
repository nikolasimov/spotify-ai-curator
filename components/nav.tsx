"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Nav() {
  const pathname = usePathname();

  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
          active
            ? "bg-white/10 text-white"
            : "text-white/40 hover:text-white/70"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-1">
        {link("/dashboard", "Dashboard")}
        {link("/playlists", "Playlists")}
      </div>
      <a
        href="/api/auth/signout"
        className="rounded-lg px-3 py-1.5 text-xs text-white/30 transition hover:text-white/60"
      >
        Sign out
      </a>
    </nav>
  );
}
