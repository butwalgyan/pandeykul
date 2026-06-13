export default function PersonSelector({ label, value, onChange, members }) {
  const sorted = [...members].sort((a, b) => a.full_name.localeCompare(b.full_name));
  const selected = members.find(m => m.id === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Select a person...</option>
        {sorted.map(m => (
          <option key={m.id} value={m.id}>
            {m.full_name} {m.gender ? `(${m.gender})` : ""}
          </option>
        ))}
      </select>
      {selected && (
        <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg">
          {selected.profile_photo
            ? <img src={selected.profile_photo} className="w-8 h-8 rounded-full object-cover" alt="" />
            : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{selected.full_name[0]}</div>
          }
          <div>
            <p className="text-xs font-semibold">{selected.full_name}</p>
            {selected.nepali_name && (
              <p className="text-[10px] text-muted-foreground">{selected.nepali_name}</p>
            )}
            <p className="text-[10px] text-muted-foreground capitalize">{selected.gender || "unknown gender"}</p>
          </div>
        </div>
      )}
    </div>
  );
}