import { createClient } from "@/lib/supabase/server";
import { Folder } from "lucide-react";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, client_type, updated_at")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Clients
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Browse and manage your clients and their cases.
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Folder className="mx-auto size-10 text-muted-foreground" />

          <h3 className="mt-4 font-medium">
            No clients yet
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Add your first client to start organizing cases.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <Folder className="size-8 shrink-0" />

              <div className="min-w-0">
                <h3 className="truncate font-medium">
                  {client.name}
                </h3>

                {client.client_type && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {client.client_type}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}