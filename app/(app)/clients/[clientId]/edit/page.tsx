import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type EditClientPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function EditClientPage({
  params,
}: EditClientPageProps) {
  const { clientId } = await params;

  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select(
      "id, name, client_type, email, phone, address, notes"
    )
    .eq("id", clientId)
    .single();

  if (error || !client) {
    notFound();
  }

  async function updateClient(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const clientType = String(
      formData.get("client_type") ?? ""
    ).trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!name) {
      return;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("clients")
      .update({
        name,
        client_type: clientType || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    if (error) {
      throw new Error(error.message);
    }

    redirect(`/clients/${clientId}`);
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="mb-5 flex items-center gap-2 text-sm">
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

            <span className="font-medium">Edit</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            Edit Client
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Update the client's information.
          </p>
        </div>

        <form
          action={updateClient}
          className="space-y-6 rounded-xl border bg-card p-6"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Client name *
            </label>

            <input
              id="name"
              name="name"
              required
              defaultValue={client.name}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="client_type"
              className="mb-2 block text-sm font-medium"
            >
              Client type
            </label>

            <select
              id="client_type"
              name="client_type"
              defaultValue={client.client_type ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            >
              <option value="">Select type</option>
              <option value="Individual">Individual</option>
              <option value="Corporate">Corporate</option>
              <option value="Government">Government</option>
              <option value="Non-profit">Non-profit</option>
            </select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={client.email ?? ""}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                defaultValue={client.phone ?? ""}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-medium"
            >
              Address
            </label>

            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={client.address ?? ""}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium"
            >
              Notes
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={client.notes ?? ""}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}