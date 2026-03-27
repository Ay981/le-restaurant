import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type Todo = {
  id: string | number;
  name: string;
};

export default async function SupabaseTodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <main className="app-bg-main min-h-screen p-6 text-white">
      <section className="app-bg-panel mx-auto max-w-2xl rounded-2xl border border-white/10 p-5">
        <h1 className="text-xl font-semibold">Supabase Todos</h1>
        <ul className="mt-4 space-y-2">
          {(todos as Todo[] | null)?.map((todo) => (
            <li key={todo.id} className="rounded-lg border border-white/10 px-3 py-2">
              {todo.name}
            </li>
          ))}
          {!todos || (todos as Todo[]).length === 0 ? (
            <li className="text-sm text-gray-400">No todos found.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
