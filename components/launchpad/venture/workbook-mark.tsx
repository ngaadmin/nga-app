/** Cath's illustrated workbook. Webp first; the png is the fallback. */
const WEBP = "/launchpad/workbook/workbook-icon-512.webp";
const PNG = "/launchpad/workbook/workbook-icon-512.png";

export function WorkbookMark({ className = "size-14" }: { className?: string }) {
  return (
    <picture>
      <source srcSet={WEBP} type="image/webp" />
      <img src={PNG} alt="" width={56} height={56} draggable={false} className={`pointer-events-none ${className}`} />
    </picture>
  );
}
