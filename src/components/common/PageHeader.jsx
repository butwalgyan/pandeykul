export default function PageHeader({ title, description, children, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
