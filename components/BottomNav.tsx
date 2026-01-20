"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Settings } from "lucide-react";

const items = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/70 bg-white/80 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-[480px] items-center justify-around px-6 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              className={`flex flex-col items-center gap-1 text-xs transition ${
                isActive
                  ? "text-ink"
                  : "text-muted hover:-translate-y-0.5 hover:text-ink"
              }`}
              href={item.href}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

