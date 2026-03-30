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

function groupFoodsByDate(foods: FoodItem[]): Record<string, FoodItem[]> {
  const grouped: Record<string, FoodItem[]> = {};

  for (const food of foods) {
    if (!grouped[food.expires_on]) {
      grouped[food.expires_on] = [];
    }
    grouped[food.expires_on].push(food);
  }

  return grouped;
}

export default async function CalendarPage() {
  const foods = await listFoods();
  const seoulToday = getSeoulToday();
  const monthKeys = getMonthKeys(foods, seoulToday.monthKey);

  return (
    <div className="min-h-screen px-4 py-5 text-zinc-900">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight">소비기한 달력</h1>
          <p className="mt-3 text-xs font-medium text-zinc-500">총 {foods.length}개 식품</p>
        </section>

        {monthKeys.map((monthKey) => {
          const monthFoods = foods.filter((food) => food.expires_on.startsWith(`${monthKey}-`));
          const foodsByDay = groupFoodsByDay(monthFoods);
          const foodsByDate = groupFoodsByDate(monthFoods);
          const dateKeys = Object.keys(foodsByDate).sort((a, b) => a.localeCompare(b));
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
            <section key={monthKey} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{getMonthLabel(monthKey)}</h2>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">
                  {monthFoods.length}개
                </span>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((dayLabel) => (
                  <p key={dayLabel} className="text-center text-xs font-semibold text-zinc-500">
                    {dayLabel}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, index) => {
                  if (day === null) {
                    return (
                      <div
                        key={`${monthKey}-empty-${index}`}
                        className="min-h-12 rounded-lg bg-zinc-50"
                      />
                    );
                  }

                  const dayFoods = foodsByDay[day] ?? [];
                  const isToday =
                    year === seoulToday.year && month === seoulToday.month && day === seoulToday.day;

                  return (
                    <article
                      key={`${monthKey}-${day}`}
                      className={`min-h-14 rounded-lg border p-1.5 ${
                        isToday
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      <p className="text-xs font-semibold text-zinc-700">{day}</p>
                      {dayFoods.length > 0 ? (
                        <p className="mt-1 rounded-md bg-amber-100 px-1 py-0.5 text-center text-[10px] font-semibold text-amber-800">
                          {dayFoods.length}개
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              {monthFoods.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
                  이 달에는 등록된 식품이 없어요.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-zinc-700">이달 소비기한 목록</p>
                  {dateKeys.map((dateKey) => (
                    <div key={dateKey} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-zinc-500">{dateKey}</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {foodsByDate[dateKey].map((food) => (
                          <li
                            key={food.id}
                            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
                          >
                            {food.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
