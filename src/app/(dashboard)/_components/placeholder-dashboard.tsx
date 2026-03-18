export function PlaceholderDashboard({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <div className="font-display text-2xl font-bold text-text-primary mb-2">
          Dashboard {title}
        </div>
        <div className="text-text-muted text-sm">
          Em breve — este dashboard está em desenvolvimento.
        </div>
      </div>
    </div>
  );
}
