export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h1 className="font-display text-[1.7rem] font-semibold leading-none tracking-tight">
          {title}
        </h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
