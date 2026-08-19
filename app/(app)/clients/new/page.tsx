import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default function NewClientPage() {
  async function createClientAction(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const clientType = String(formData.get("client_type") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

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

    const { error } = await supabase.from("clients").insert({
      organization_id: profile.organization_id,
      name,
      client_type: clientType || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect("/clients");
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/clients"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Clients
          </Link>

          <h2 className="mt-5 text-2xl font-semibold tracking-tight">
            New Client
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Add a client and begin organizing their cases.
          </p>
        </div>

        <form
          action={createClientAction}
          className="space-y-6 rounded-xl border bg-card p-6"
        >
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Client name *
            </label>

            <input
              id="name"
              name="name"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="e.g. ABC Industries"
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
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              defaultValue=""
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
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="client@example.com"
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
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="+91 ..."
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
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Optional notes about the client..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link
              href="/clients"
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}