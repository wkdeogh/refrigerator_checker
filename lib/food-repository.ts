import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { FoodItem } from "@/types/food";

type InsertFoodInput = {
  name: string;
  expiresOn: string;
};

type UpdateFoodInput = InsertFoodInput & {
  id: string;
};

export async function listFoods(): Promise<FoodItem[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("food_items")
    .select("id, name, expires_on, created_at")
    .order("expires_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load foods: ${error.message}`);
  }

  return data;
}

export async function listFoodsBySearch(searchTerm: string): Promise<FoodItem[]> {
  const trimmed = searchTerm.trim();
  if (!trimmed) {
    return listFoods();
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("food_items")
    .select("id, name, expires_on, created_at")
    .ilike("name", `%${trimmed}%`)
    .order("expires_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load foods: ${error.message}`);
  }

  return data;
}

export async function addFood(input: InsertFoodInput): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("food_items").insert({
    name: input.name,
    expires_on: input.expiresOn,
  });

  if (error) {
    throw new Error(`Failed to add food: ${error.message}`);
  }
}

export async function removeFood(foodId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("food_items").delete().eq("id", foodId);

  if (error) {
    throw new Error(`Failed to remove food: ${error.message}`);
  }
}

export async function updateFood(input: UpdateFoodInput): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("food_items")
    .update({
      name: input.name,
      expires_on: input.expiresOn,
    })
    .eq("id", input.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update food: ${error.message}`);
  }

  if (!data) {
    throw new Error("수정할 항목을 찾을 수 없습니다.");
  }
}
