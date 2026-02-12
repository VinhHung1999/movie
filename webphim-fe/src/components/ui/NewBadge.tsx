export default function NewBadge() {
  return (
    <span
      data-testid="new-badge"
      className="absolute top-1 left-1 z-10 rounded bg-netflix-red px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow"
      aria-label="Recently added"
    >
      New
    </span>
  );
}
