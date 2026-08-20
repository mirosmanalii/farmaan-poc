import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type EditCasePageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function EditCasePage({
  params,
}: EditCasePageProps) {
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

  async function updateCase(formData: FormData) {
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

    const { data: currentCase, error: currentCaseError } =
      await supabase
        .from("cases")
        .select(
          `
            id,
            client_id,
            clients (
              organization_id
            )
          `
        )
        .eq("id", caseId)
        .single();

    if (currentCaseError || !currentCase) {
      throw new Error("Case not found.");
    }

    const caseClient = Array.isArray(currentCase.clients)
      ? currentCase.clients[0]
      : currentCase.clients;

    if (
      !caseClient ||
      caseClient.organization_id !== profile.organization_id
    ) {
      throw new Error("You cannot edit this case.");
    }

    const { error: updateError } = await supabase
      .from("cases")
      .update({
        name,
        case_number: caseNumber || null,
        court: court || null,
        case_type: caseType || null,
        status: status || "active",
        filing_date: filingDate || null,
        next_hearing_date: nextHearingDate || null,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    redirect(`/cases/${caseId}`);
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

          <Link
            href={`/cases/${caseItem.id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            {caseItem.name}
          </Link>

          <span className="text-muted-foreground">/</span>

          <span className="font-medium">Edit</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Edit Case
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Update the case information.
          </p>
        </div>

        {/* Form */}
        <form
          action={updateCase}
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
              defaultValue={caseItem.name}
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
              defaultValue={caseItem.case_number ?? ""}
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
                defaultValue={caseItem.court ?? ""}
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
                defaultValue={caseItem.case_type ?? ""}
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
              defaultValue={caseItem.status ?? "active"}
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
                defaultValue={caseItem.filing_date ?? ""}
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
                defaultValue={caseItem.next_hearing_date ?? ""}
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
              defaultValue={caseItem.description ?? ""}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <Link
              href={`/cases/${caseItem.id}`}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}