import Link from "next/link";
import { Clock3, Folder } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r bg-muted/30">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Farmaan
        </Link>
      </div>

      <nav className="p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Clock3 className="size-4" />
          Recent
        </Link>

        <Link
          href="/clients"
          className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Folder className="size-4" />
          Clients
        </Link>
      </nav>
    </aside>
  );
}