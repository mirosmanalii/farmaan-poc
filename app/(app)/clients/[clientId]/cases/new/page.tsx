import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type NewCasePageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function NewCasePage({
  params,
}: NewCasePageProps) {
  const { clientId } = await params;

  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    notFound();
  }

  async function createCase(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const caseNumber = String(
      formData.get("case_number") ?? ""
    ).trim();
    const court = String(formData.get("court") ?? "").trim();
    const caseType = String(
      formData.get("case_type") ?? ""
    ).trim();
    const status = String(
      formData.get("status") ?? "active"
    ).trim();
    const filingDate = String(
      formData.get("filing_date") ?? ""
    ).trim();
    const nextHearingDate = String(
      formData.get("next_hearing_date") ?? ""
    ).trim();
    const description = String(
      formData.get("description") ?? ""
    ).trim();

    if (!name) {
      return;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Could not determine your organization.");
    }

    const { data: clientRecord, error: clientError } =
      await supabase
        .from("clients")
        .select("id, organization_id")
        .eq("id", clientId)
        .single();

    if (clientError || !clientRecord) {
      throw new Error("Client not found.");
    }

    if (clientRecord.organization_id !== profile.organization_id) {
      throw new Error("You cannot create a case for this client.");
    }

    const { data: newCase, error: insertError } =
      await supabase
        .from("cases")
        .insert({
          client_id: clientId,
          name,
          case_number: caseNumber || null,
          court: court || null,
          case_type: caseType || null,
          status: status || "active",
          filing_date: filingDate || null,
          next_hearing_date: nextHearingDate || null,
          description: description || null,
        })
        .select("id")
        .single();

    if (insertError || !newCase) {
      throw new Error(
        insertError?.message ?? "Failed to create case."
      );
    }

    redirect(`/cases/${newCase.id}`);
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        {/* Breadcrumb */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
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

          <span className="font-medium">New Case</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            New Case
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Create a new case for {client.name}.
          </p>
        </div>

        {/* Form */}
        <form
          action={createCase}
          className="space-y-6 rounded-xl border bg-card p-6"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Case name *
            </label>

            <input
              id="name"
              name="name"
              required
              placeholder="e.g. ABC Industries v. XYZ Manufacturing"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="case_number"
              className="mb-2 block text-sm font-medium"
            >
              Case number
            </label>

            <input
              id="case_number"
              name="case_number"
              placeholder="e.g. CS(COMM) 184/2025"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="court"
                className="mb-2 block text-sm font-medium"
              >
                Court
              </label>

              <input
                id="court"
                name="court"
                placeholder="e.g. Delhi High Court"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="case_type"
                className="mb-2 block text-sm font-medium"
              >
                Case type
              </label>

              <input
                id="case_type"
                name="case_type"
                placeholder="e.g. Commercial Dispute"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium"
            >
              Status
            </label>

            <select
              id="status"
              name="status"
              defaultValue="active"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            >
              <option value="active">Active</option>
              <option value="hearing">Hearing</option>
              <option value="research">Research</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="filing_date"
                className="mb-2 block text-sm font-medium"
              >
                Filing date
              </label>

              <input
                id="filing_date"
                name="filing_date"
                type="date"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="next_hearing_date"
                className="mb-2 block text-sm font-medium"
              >
                Next hearing
              </label>

              <input
                id="next_hearing_date"
                name="next_hearing_date"
                type="date"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Brief description of the case..."
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Link
              href={`/clients/${client.id}`}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}