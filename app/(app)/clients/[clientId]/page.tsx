import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Folder } from "lucide-react";
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
      <div className="mb-8">
        <Link
          href="/clients"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Clients
        </Link>

        <h2 className="text-2xl font-semibold tracking-tight">
          {client.name}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {client.client_type ?? "Client"}
        </p>
      </div>

      <div>
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
          <div className="divide-y rounded-xl border bg-card">
            {cases.map((caseItem) => (
              <Link
                key={caseItem.id}
                href={`/cases/${caseItem.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50"
              >
                <Folder className="size-7 shrink-0" />

                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium">
                    {caseItem.name}
                  </h4>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {caseItem.case_number && (
                      <span>{caseItem.case_number}</span>
                    )}

                    {caseItem.court && (
                      <span>{caseItem.court}</span>
                    )}

                    {caseItem.case_type && (
                      <span>{caseItem.case_type}</span>
                    )}
                  </div>
                </div>

                <span className="text-sm capitalize text-muted-foreground">
                  {caseItem.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}