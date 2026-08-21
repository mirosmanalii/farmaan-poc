import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type DocumentsPageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function DocumentsPage({
  params,
}: DocumentsPageProps) {
  const { caseId } = await params;

  const supabase = await createClient();

  const { data: caseItem, error: caseError } = await supabase
    .from("cases")
    .select(
      `
        id,
        name,
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

  const { data: documents, error: documentsError } =
    await supabase
      .from("documents")
      .select(
        "id, name, file_type, file_size, uploaded_at"
      )
      .eq("case_id", caseId)
      .order("uploaded_at", { ascending: false });

  if (documentsError) {
    throw new Error(documentsError.message);
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

        <Link
          href={`/cases/${caseItem.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          {caseItem.name}
        </Link>

        <span className="text-muted-foreground">/</span>

        <span className="font-medium">Documents</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Documents
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Documents associated with {caseItem.name}.
          </p>
        </div>

        <Link
          href={`/cases/${caseItem.id}/documents/upload`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="size-4" />
          Upload PDF
        </Link>
      </div>

      {/* Documents */}
      {documents.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground" />

          <h2 className="mt-4 font-medium">
            No documents yet
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Upload a PDF to begin building this case file.
          </p>

          <Link
            href={`/cases/${caseItem.id}/documents/upload`}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="size-4" />
            Upload PDF
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_160px] border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div>Name</div>
            <div>Type</div>
            <div>Size</div>
            <div>Uploaded</div>
          </div>

          {/* Document rows */}
          <div>
            {documents.map((document) => (
              <div
                key={document.id}
                className="grid grid-cols-[minmax(0,1fr)_140px_140px_160px] items-center border-b px-4 py-3.5 last:border-b-0 hover:bg-muted/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-5 shrink-0" />

                  <span className="truncate text-sm font-medium">
                    {document.name}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  {document.file_type ?? "—"}
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatFileSize(document.file_size)}
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatDate(document.uploaded_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back to case */}
      <div className="mt-6">
        <Link
          href={`/cases/${caseItem.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to case
        </Link>
      </div>
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

function formatFileSize(size: number | null) {
  if (!size) {
    return "—";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}