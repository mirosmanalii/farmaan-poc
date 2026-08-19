import Link from "next/link";
import { notFound } from "next/navigation";
import { Folder } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type ClientPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function ClientPage({
  params,
}: ClientPageProps) {
  const { clientId } = await params;

  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, client_type, email, phone")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    notFound();
  }

  const { data: cases, error: casesError } = await supabase
    .from("cases")
    .select(
      "id, name, case_number, court, case_type, status, next_hearing_date"
    )
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  if (casesError) {
    throw new Error(casesError.message);
  }

  return (
    <div className="p-8">
      {/* Client header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-2 text-sm">
            <Link
              href="/clients"
              className="text-muted-foreground hover:text-foreground"
            >
              Clients
            </Link>

            <span className="text-muted-foreground">/</span>

            <span className="font-medium">{client.name}</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            {client.name}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {client.client_type ?? "Client"}
          </p>
        </div>

        {/* Edit button */}
        <Link
          href={`/clients/${client.id}/edit`}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Edit Client
        </Link>
      </div>

      {/* Cases */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Cases</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Cases and matters associated with this client.
          </p>
        </div>

        {cases.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Folder className="mx-auto size-10 text-muted-foreground" />

            <h4 className="mt-4 font-medium">
              No cases yet
            </h4>

            <p className="mt-2 text-sm text-muted-foreground">
              Cases for this client will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            {/* Table header */}
            <div className="grid grid-cols-[minmax(0,1fr)_180px_160px] border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <div>Name</div>
              <div>Court</div>
              <div>Status</div>
            </div>

            {/* Case rows */}
            <div>
              {cases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={`/cases/${caseItem.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_180px_160px] items-center border-b px-4 py-3.5 last:border-b-0 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Folder className="size-5 shrink-0" />

                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {caseItem.name}
                      </div>

                      {caseItem.case_number && (
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {caseItem.case_number}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="truncate text-sm text-muted-foreground">
                    {caseItem.court ?? "—"}
                  </div>

                  <div className="text-sm capitalize text-muted-foreground">
                    {caseItem.status}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}