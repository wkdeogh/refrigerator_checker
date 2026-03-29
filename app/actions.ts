"use server";

import { revalidatePath } from "next/cache";
import { addFood, removeFood } from "@/lib/food-repository";

function normalizeDateInput(rawDate: string): string {
  const trimmed = rawDate.trim();
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  if (!valid) {
    throw new Error("소비기한 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)");
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isCalendarDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day;

  if (!isCalendarDate) {
    throw new Error("존재하지 않는 날짜입니다. 소비기한을 다시 확인해주세요.");
  }

  return trimmed;
}

export async function createFoodAction(formData: FormData): Promise<void> {
  const rawName = formData.get("name");
  const rawExpiresOn = formData.get("expiresOn");

  const name = typeof rawName === "string" ? rawName.trim() : "";
  const expiresOn =
    typeof rawExpiresOn === "string" ? normalizeDateInput(rawExpiresOn) : "";

  if (!name) {
    throw new Error("식품 이름을 입력해주세요.");
  }

  if (name.length > 40) {
    throw new Error("식품 이름은 40자 이하로 입력해주세요.");
  }

  if (!expiresOn) {
    throw new Error("소비기한 날짜를 입력해주세요.");
  }

  await addFood({
    name,
    expiresOn,
  });

  revalidatePath("/");
}

export async function removeFoodAction(formData: FormData): Promise<void> {
  const rawId = formData.get("id");
  const id = typeof rawId === "string" ? rawId.trim() : "";

  if (!id) {
    throw new Error("삭제할 항목 id가 없습니다.");
  }

  await removeFood(id);
  revalidatePath("/");
}
