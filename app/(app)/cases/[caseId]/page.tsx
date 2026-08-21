import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  FileText,
  Folder,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type CasePageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function CasePage({
  params,
}: CasePageProps) {
  const { caseId } = await params;

  const supabase = await createClient();

  const { data: caseItem, error: caseError } = await supabase
    .from("cases")
    .select(
      `
        id,
        name,
        case_number,
        court,
        case_type,
        status,
        filing_date,
        next_hearing_date,
        description,
        client_id,
        clients (
          id,
          name
        )
      `
    )
    .eq("id", caseId)
    .single();

  if (caseError || !caseItem) {
    notFound();
  }

  const client = Array.isArray(caseItem.clients)
    ? caseItem.clients[0]
    : caseItem.clients;

  if (!client) {
    notFound();
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/clients"
          className="text-muted-foreground hover:text-foreground"
        >
          Clients
        </Link>

        <span className="text-muted-foreground">/</span>

        <Link
          href={`/clients/${client.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          {client.name}
        </Link>

        <span className="text-muted-foreground">/</span>

        <span className="font-medium">{caseItem.name}</span>
      </div>

      {/* Case header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <Folder className="size-6 shrink-0" />

            <span className="text-sm text-muted-foreground">
              Case
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            {caseItem.name}
          </h1>

          {caseItem.case_number && (
            <p className="mt-2 text-sm text-muted-foreground">
              {caseItem.case_number}
            </p>
          )}
        </div>

        <Link
          href={`/cases/${caseItem.id}/edit`}
          className="shrink-0 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Edit Case
        </Link>
      </div>

      {/* Case metadata */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="size-4" />
            Client
          </div>

          <Link
            href={`/clients/${client.id}`}
            className="font-medium hover:underline"
          >
            {client.name}
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            Court
          </div>

          <p className="font-medium">
            {caseItem.court ?? "Not specified"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" />
            Case Type
          </div>

          <p className="font-medium">
            {caseItem.case_type ?? "Not specified"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            Status
          </div>

          <p className="font-medium capitalize">
            {caseItem.status ?? "Not specified"}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Filing Date
          </p>

          <p className="mt-2 font-medium">
            {caseItem.filing_date
              ? formatDate(caseItem.filing_date)
              : "Not specified"}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Next Hearing
          </p>

          <p className="mt-2 font-medium">
            {caseItem.next_hearing_date
              ? formatDate(caseItem.next_hearing_date)
              : "Not scheduled"}
          </p>
        </div>
      </div>

      {/* Description */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">
          Case Description
        </h2>

        <div className="rounded-xl border bg-card p-5">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {caseItem.description ?? "No description available."}
          </p>
        </div>
      </section>

      {/* Case workspace */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Case Workspace
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Documents */}
          <Link
            href={`/cases/${caseItem.id}/documents`}
            className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/50"
          >
            <Folder className="mb-3 size-5" />

            <h3 className="font-medium">
              Documents
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Case files and supporting documents.
            </p>
          </Link>

          {/* Timeline */}
          <div className="rounded-xl border bg-card p-5">
            <CalendarDays className="mb-3 size-5" />

            <h3 className="font-medium">
              Timeline
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Important events and case history.
            </p>
          </div>

          {/* Parties */}
          <div className="rounded-xl border bg-card p-5">
            <FileText className="mb-3 size-5" />

            <h3 className="font-medium">
              Parties
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              People and organizations involved.
            </p>
          </div>

          {/* Notes */}
          <div className="rounded-xl border bg-card p-5">
            <FileText className="mb-3 size-5" />

            <h3 className="font-medium">
              Notes
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Internal case notes and observations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}