import Link from "next/link";
import { Folder, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type ClientsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ClientsPage({
  searchParams,
}: ClientsPageProps) {
  const { q } = await searchParams;
  const searchQuery = q?.trim() ?? "";

  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, client_type, updated_at")
    .order("name");

  if (searchQuery) {
    query = query.ilike("name", `%${searchQuery}%`);
  }

  const { data: clients, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
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
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New Client
        </Link>
      </div>

      {/* Search */}
      <form
        action="/clients"
        method="GET"
        className="mb-5"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            type="search"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search clients..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2"
          />
        </div>
      </form>

      {/* Client count */}
      <div className="mb-3 text-sm text-muted-foreground">
        {searchQuery
          ? `${clients.length} result${clients.length === 1 ? "" : "s"} for "${searchQuery}"`
          : `${clients.length} client${clients.length === 1 ? "" : "s"}`}
      </div>

      {/* Empty state */}
      {clients.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Folder className="mx-auto size-10 text-muted-foreground" />

          <h3 className="mt-4 font-medium">
            {searchQuery ? "No clients found" : "No clients yet"}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery
              ? "Try a different search term."
              : "Add your first client to start organizing cases."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[minmax(0,1fr)_180px_160px] border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div>Name</div>
            <div>Type</div>
            <div>Updated</div>
          </div>

          {/* Rows */}
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