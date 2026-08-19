import Link from "next/link";
import { Folder, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Clients
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Browse and manage your clients and their cases.
          </p>
        </div>

        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Client
        </Link>
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
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="grid grid-cols-[minmax(0,1fr)_180px_160px] border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div>Name</div>
            <div>Type</div>
            <div>Updated</div>
          </div>

          <div>
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="grid grid-cols-[minmax(0,1fr)_180px_160px] items-center border-b px-4 py-3.5 last:border-b-0 hover:bg-muted/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Folder className="size-5 shrink-0" />

                  <span className="truncate text-sm font-medium">
                    {client.name}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  {client.client_type ?? "—"}
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatDate(client.updated_at)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}