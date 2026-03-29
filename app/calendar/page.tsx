import { MainTabs } from "@/app/_components/main-tabs";
import { listFoods } from "@/lib/food-repository";
import type { FoodItem } from "@/types/food";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getSeoulToday() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(new Date()).split("-").map(Number);

  return {
    year,
    month,
    day,
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
  };
}

function parseYearMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}

function getMonthLabel(monthKey: string) {
  const { year, month } = parseYearMonth(monthKey);
  return `${year}년 ${month}월`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getMonthKeys(foods: FoodItem[], currentMonthKey: string): string[] {
  const monthSet = new Set<string>();

  for (const food of foods) {
    monthSet.add(food.expires_on.slice(0, 7));
  }

  monthSet.add(currentMonthKey);

  return Array.from(monthSet).sort((a, b) => a.localeCompare(b));
}

function groupFoodsByDay(foods: FoodItem[]): Record<number, FoodItem[]> {
  const grouped: Record<number, FoodItem[]> = {};

  for (const food of foods) {
    const day = Number(food.expires_on.slice(8, 10));
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(food);
  }

  return grouped;
}

export default async function CalendarPage() {
  const foods = await listFoods();
  const seoulToday = getSeoulToday();
  const monthKeys = getMonthKeys(foods, seoulToday.monthKey);

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold">소비기한 달력</h1>
          <p className="mt-1 text-sm text-zinc-600">
            등록된 식품의 소비기한을 월별 달력에서 확인할 수 있어요.
          </p>
        </section>

        <MainTabs current="calendar" />

        {monthKeys.map((monthKey) => {
          const monthFoods = foods.filter((food) => food.expires_on.startsWith(`${monthKey}-`));
          const foodsByDay = groupFoodsByDay(monthFoods);
          const { year, month } = parseYearMonth(monthKey);
          const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
          const daysInMonth = getDaysInMonth(year, month);
          const cells: Array<number | null> = [];

          for (let i = 0; i < firstWeekday; i += 1) {
            cells.push(null);
          }

          for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push(day);
          }

          while (cells.length % 7 !== 0) {
            cells.push(null);
          }

          return (
            <section key={monthKey} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{getMonthLabel(monthKey)}</h2>
                <span className="text-sm text-zinc-500">소비기한 {monthFoods.length}개</span>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-2">
                {WEEKDAY_LABELS.map((dayLabel) => (
                  <p key={dayLabel} className="text-center text-xs font-semibold text-zinc-500">
                    {dayLabel}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {cells.map((day, index) => {
                  if (day === null) {
                    return <div key={`${monthKey}-empty-${index}`} className="min-h-20 rounded-xl bg-zinc-50" />;
                  }

                  const dayFoods = foodsByDay[day] ?? [];
                  const isToday =
                    year === seoulToday.year && month === seoulToday.month && day === seoulToday.day;

                  return (
                    <article
                      key={`${monthKey}-${day}`}
                      className={`min-h-24 rounded-xl border p-2 ${
                        isToday
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      <p className="text-xs font-semibold text-zinc-700">{day}</p>

                      {dayFoods.length === 0 ? (
                        <p className="mt-2 text-[11px] text-zinc-400">식품 없음</p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-1">
                          {dayFoods.slice(0, 2).map((food) => (
                            <li
                              key={food.id}
                              className="truncate rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800"
                            >
                              {food.name}
                            </li>
                          ))}
                          {dayFoods.length > 2 ? (
                            <li className="text-[11px] font-medium text-zinc-500">
                              +{dayFoods.length - 2}개 더 있음
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </article>
                  );
                })}
              </div>

              {monthFoods.length === 0 ? (
                <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
                  이 달에는 등록된 식품이 없어요.
                </p>
              ) : null}
            </section>
          );
        })}
      </main>
    </div>
  );
}
