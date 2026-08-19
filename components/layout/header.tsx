import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="search"
          placeholder="Search clients, cases, documents..."
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2"
        />
      </div>

      <div className="ml-6 text-sm font-medium">
        Account
      </div>
    </header>
  );
}