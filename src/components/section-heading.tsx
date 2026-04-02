type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-2xl space-y-3">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-4xl sm:text-5xl">{title}</h2>
      {description ? (
        <p className="text-base leading-7 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
