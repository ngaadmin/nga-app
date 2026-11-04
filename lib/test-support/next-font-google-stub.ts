/** Vitest stand-in for next/font/google (the real loader needs the Next.js compiler). */
type FontResult = { className: string; style: { fontFamily: string }; variable?: string };

const stub = (name: string) => (): FontResult => ({ className: `font-${name.toLowerCase()}`, style: { fontFamily: name } });

export const Poppins = stub("Poppins");
export const Fredoka = stub("Fredoka");
export const Pacifico = stub("Pacifico");
