import { createFoodAction, removeFoodAction, updateFoodAction } from "@/app/actions";
import { FormSubmitButton } from "@/app/_components/form-submit-button";
import { listFoodsBySearch } from "@/lib/food-repository";
import type { FoodItem } from "@/types/food";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string | string[];
}>;

function getDaysLeft(expiresOn: string): number {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayInSeoul = formatter.format(new Date());
  const [todayYear, todayMonth, todayDay] = todayInSeoul
    .split("-")
    .map(Number);

  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);

  const [year, month, day] = expiresOn.split("-").map(Number);
  const expiryUtc = Date.UTC(year, month - 1, day);
  const diffMs = expiryUtc - todayUtc;

  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getStatusLabel(food: FoodItem): { label: string; tone: string } {
  const daysLeft = getDaysLeft(food.expires_on);

  if (daysLeft < 0) {
    return {
      label: `${Math.abs(daysLeft)}일 지남`,
      tone: "bg-red-100 text-red-700",
    };
  }

  if (daysLeft === 0) {
    return {
      label: "오늘까지",
      tone: "bg-red-100 text-red-700",
    };
  }

  if (daysLeft <= 3) {
    return {
      label: `${daysLeft}일 남음`,
      tone: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: `${daysLeft}일 남음`,
    tone: "bg-emerald-100 text-emerald-700",
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const foods = await listFoodsBySearch(query);
  const isSearching = query.trim().length > 0;

  return (
    <div className="min-h-screen px-4 py-5 text-zinc-900">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <form className="flex gap-2" action="/" method="get">
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="식품 이름 검색"
              className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-300 px-3 text-base outline-none ring-emerald-500 focus:ring-2"
            />
            <button
              type="submit"
              className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              검색
            </button>
            {isSearching ? (
              <Link
                href="/"
                className="inline-flex h-11 items-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                초기화
              </Link>
            ) : null}
          </form>
        </section>

        <details className="rounded-3xl bg-white p-5 shadow-sm">
          <summary className="cursor-pointer list-none rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99]">
            식품 등록하기
          </summary>

          <form action={createFoodAction} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              식품 이름
              <input
                required
                name="name"
                maxLength={40}
                placeholder="예: 우유"
                className="h-11 rounded-xl border border-zinc-300 px-3 text-base outline-none ring-emerald-500 focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              소비기한
              <input
                required
                name="expiresOn"
                type="date"
                className="h-11 rounded-xl border border-zinc-300 px-3 text-base outline-none ring-emerald-500 focus:ring-2"
              />
            </label>

            <FormSubmitButton
              idleLabel="등록하기"
              pendingLabel="등록 중"
              className="mt-1 h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
            />
          </form>
        </details>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">등록된 식품</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">
              {foods.length}개
            </span>
          </div>

          {foods.length === 0 ? (
            <p className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
              아직 등록된 식품이 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {foods.map((food) => {
                const status = getStatusLabel(food);

                return (
                  <li key={food.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{food.name}</p>
                        <p className="text-xs text-zinc-500">소비기한 {food.expires_on}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.tone}`}
                        >
                          {status.label}
                        </span>

                        <form action={removeFoodAction}>
                          <input type="hidden" name="id" value={food.id} />
                          <FormSubmitButton
                            idleLabel="삭제"
                            pendingLabel="삭제 중"
                            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-700 transition hover:bg-zinc-100"
                          />
                        </form>
                      </div>
                    </div>

                    <details className="border-t border-zinc-200 bg-white px-3 py-2">
                      <summary className="cursor-pointer list-none text-xs font-semibold text-zinc-500 transition hover:text-zinc-700">
                        수정
                      </summary>

                      <form action={updateFoodAction} className="mt-3 flex flex-col gap-3">
                        <input type="hidden" name="id" value={food.id} />

                        <label className="flex flex-col gap-1 text-sm font-medium">
                          식품 이름
                          <input
                            required
                            name="name"
                            maxLength={40}
                            defaultValue={food.name}
                            className="h-11 rounded-xl border border-zinc-300 px-3 text-base outline-none ring-emerald-500 focus:ring-2"
                          />
                        </label>

                        <label className="flex flex-col gap-1 text-sm font-medium">
                          소비기한
                          <input
                            required
                            name="expiresOn"
                            type="date"
                            defaultValue={food.expires_on}
                            className="h-11 rounded-xl border border-zinc-300 px-3 text-base outline-none ring-emerald-500 focus:ring-2"
                          />
                        </label>

                        <FormSubmitButton
                          idleLabel="수정하기"
                          pendingLabel="수정 중"
                          className="h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        />
                      </form>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
