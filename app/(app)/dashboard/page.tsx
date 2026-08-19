export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Recent Cases
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Access your recent cases and continue where you left off.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-12 text-center">
        <h3 className="font-medium">No recent cases</h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Your recent cases will appear here.
        </p>
      </div>
    </div>
  );
}