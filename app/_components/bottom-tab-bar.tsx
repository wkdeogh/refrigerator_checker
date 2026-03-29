"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈" },
  { href: "/calendar", label: "달력" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <nav
        aria-label="하단 탭"
        className="pointer-events-auto mx-auto mb-3 grid w-[calc(100%-1.25rem)] max-w-sm grid-cols-2 rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-lg backdrop-blur"
      >
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
