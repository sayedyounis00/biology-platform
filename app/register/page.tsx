import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("years")
    .select("id, title")
    .order("order_index", { ascending: true });
    
  const years = data || [];

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F1623]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400"></div>
      </div>
    }>
      <RegisterForm years={years} />
    </Suspense>
  );
}
