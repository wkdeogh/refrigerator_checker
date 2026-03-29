import Link from "next/link";

type TabKey = "home" | "calendar";

type MainTabsProps = {
  current: TabKey;
};

export function MainTabs({ current }: MainTabsProps) {
  const homeClass =
    current === "home"
      ? "bg-emerald-600 text-white"
      : "bg-white text-zinc-700 hover:bg-zinc-100";
  const calendarClass =
    current === "calendar"
      ? "bg-emerald-600 text-white"
      : "bg-white text-zinc-700 hover:bg-zinc-100";

  return (
    <nav className="grid grid-cols-2 gap-2" aria-label="메인 탭">
      <Link
        href="/"
        className={`rounded-xl border border-zinc-200 px-3 py-2 text-center text-sm font-semibold transition ${homeClass}`}
      >
        홈
      </Link>
      <Link
        href="/calendar"
        className={`rounded-xl border border-zinc-200 px-3 py-2 text-center text-sm font-semibold transition ${calendarClass}`}
      >
        달력
      </Link>
    </nav>
  );
}
