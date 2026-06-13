export default function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <Icon className={`w-6 h-6 ${color}`} />
      <div>
        <p className="text-2xl font-bold font-heading">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
