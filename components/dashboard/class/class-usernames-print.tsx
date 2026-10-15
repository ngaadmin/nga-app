"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { DASHBOARD_CLASS_PATH } from "@/lib/onboarding/guest-session";
import {
  buildUsernamesPdf,
  classUsernamesPdfName,
} from "@/lib/school/class-usernames-pdf";

type ClassUsernamesPrintScreenProps = {
  classId: string;
  className: string;
  cohortEmoji: string;
  usernames: string[];
};

function UsernameSheet({
  className,
  cohortEmoji,
  usernames,
}: Omit<ClassUsernamesPrintScreenProps, "classId">) {
  return (
    <section className="box-border w-[794px] bg-white px-16 py-14 text-[#14213D]">
      <div className="flex items-center border-b-2 border-[#031F82] pb-[22px]">
        <Image
          src="/nga-logo-tm.svg"
          alt="NextGenAchievers"
          width={190}
          height={54}
          unoptimized
          className="h-[54px] w-auto"
        />
      </div>
      <h2 className="mt-7 font-heading text-[30px] font-bold leading-[1.2] text-[#031F82]">
        {className}
        {cohortEmoji ? <span aria-hidden> {cohortEmoji}</span> : null}
      </h2>
      <table className="mt-7 w-full border-collapse text-left font-sans text-base">
        <thead>
          <tr>
            {["#", "User", "Username"].map((label) => (
              <th
                key={label}
                className="border-b-2 border-[#031F82] px-2 py-2.5 text-left font-heading text-[13px] font-bold tracking-[0.5px] text-[#4A5675]"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usernames.map((name, index) => (
            <tr key={name}>
              <td className="w-12 border-b border-[#E1E8F6] px-2 py-[13px] font-medium text-[#4A5675]">
                {index + 1}
              </td>
              <td className="border-b border-[#E1E8F6] px-2 py-[13px]">&nbsp;</td>
              <td className="border-b border-[#E1E8F6] px-2 py-[13px] font-heading font-bold text-[#031F82]">
                {name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function ClassUsernamesPrintScreen({
  classId,
  className,
  cohortEmoji,
  usernames,
}: ClassUsernamesPrintScreenProps) {
  const printed = useRef(false);

  useEffect(() => {
    if (printed.current) return;
    const key = `class-usernames-print:${classId}`;
    const last = Number(window.sessionStorage.getItem(key) || "0");
    if (Date.now() - last < 1500) return;
    printed.current = true;
    window.sessionStorage.setItem(key, String(Date.now()));
    window.print();
  }, [classId]);

  async function downloadPdf() {
    const bytes = buildUsernamesPdf({ className, usernames });
    const blob = new Blob([
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    ], { type: "application/pdf" });
    const file = new File([blob], classUsernamesPdfName(className), {
      type: "application/pdf",
    });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        return;
      }
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(180deg,#EEF5FF_0%,#FFFFFF_55%)] font-sans text-[#14213D] print:block print:min-h-0 print:bg-white">
      <style>{`@media print { @page { size: A4 portrait; margin: 0; } }`}</style>
      <header className="flex h-[52px] items-center gap-2.5 px-5 print:hidden">
        <Link href={DASHBOARD_CLASS_PATH} aria-label="Back" className="text-[#031F82]">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none" stroke="#031F82" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5 8 12l7 7" />
          </svg>
        </Link>
        <h1 className="font-heading text-[18px] font-bold text-[#031F82]">Usernames</h1>
      </header>
      <div className="mx-auto mt-2 hidden w-[794px] print:block">
        <UsernameSheet className={className} cohortEmoji={cohortEmoji} usernames={usernames} />
      </div>
      <div className="mx-auto mt-2 h-[495px] w-[350px] overflow-hidden rounded-[6px] border border-[#E1E8F6] bg-white shadow-[0_1px_0_#E1E8F6] print:hidden">
        <div className="origin-top-left scale-[0.4408]">
          <UsernameSheet className={className} cohortEmoji={cohortEmoji} usernames={usernames} />
        </div>
      </div>
      <div className="mx-auto mt-auto flex w-full max-w-[720px] flex-col items-center gap-[18px] px-5 pb-6 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex h-14 w-full items-center justify-center rounded-full bg-[#031F82] font-heading text-[19px] font-bold text-white shadow-[0_4px_0_#FFB822]"
        >
          Print
        </button>
        <button
          type="button"
          onClick={() => void downloadPdf()}
          className="border-b-2 border-[#FFB822] font-heading text-base font-semibold text-[#031F82]"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
