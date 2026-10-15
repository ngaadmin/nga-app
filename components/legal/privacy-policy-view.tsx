import type { ReactNode } from "react";
import type {
  InlineNode,
  PrivacyBlock,
} from "@/lib/privacy/parse-privacy-markdown";
import {
  inlineText,
  safePolicyHref,
} from "@/lib/privacy/parse-privacy-markdown";
import { splitTrailingQualifier } from "@/lib/privacy/split-trailing-qualifier";

function InlineView({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => (
        <InlineNodeView key={index} node={node} />
      ))}
    </>
  );
}

function InlineNodeView({ node }: { node: InlineNode }) {
  if (node.kind === "text") return node.value;
  if (node.kind === "strong") {
    return (
      <strong className="font-sans font-semibold text-[#031F82]">
        <InlineView nodes={node.children} />
      </strong>
    );
  }
  if (node.kind === "em") {
    return (
      <em className="font-sans font-semibold not-italic">
        <InlineView nodes={node.children} />
      </em>
    );
  }

  const href = safePolicyHref(node.href);
  if (!href) return <InlineView nodes={node.children} />;

  return (
    <a
      href={href}
      className="font-semibold text-[#031F82] underline decoration-[#031F82]/40 underline-offset-2 hover:decoration-[#031F82]"
    >
      <InlineView nodes={node.children} />
    </a>
  );
}

const bodyClass = "font-sans text-base font-normal leading-normal text-[#1E3A5F]";

function FirstColumnLabel({ nodes }: { nodes: InlineNode[] }) {
  const { label, qualifier } = splitTrailingQualifier(inlineText(nodes));

  return (
    <span className="block">
      <span className="block font-heading text-base font-semibold leading-snug text-[#031F82]">
        {label}
      </span>
      {qualifier ? (
        <span className="mt-0.5 block font-sans text-sm font-semibold leading-normal text-[#5B6B8C]">
          {qualifier}
        </span>
      ) : null}
    </span>
  );
}

function TableView({
  headers,
  rows,
  className,
}: {
  headers: InlineNode[][];
  rows: InlineNode[][][];
  className?: string;
}) {
  return (
    <div className={className} data-privacy-table>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <section key={rowIndex} className="rounded-[20px] bg-[#EDF5FF] p-5">
            <FirstColumnLabel nodes={row[0] ?? []} />
            {row.slice(1).map((cell, cellIndex) => (
              <p key={cellIndex} className={`mt-3 ${bodyClass}`}>
                <InlineView nodes={cell} />
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[20px] border border-[#DCE6F5] md:block">
        <table className="w-full table-fixed border-collapse text-left font-sans text-[15px] font-normal leading-normal text-[#1E3A5F]">
          <thead>
            <tr className="border-b border-[#E6EDF8] bg-[#EDF5FF]">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={
                    index === 0
                      ? "w-[30%] whitespace-normal px-5 py-4 text-left font-heading text-sm font-semibold leading-snug text-[#031F82]"
                      : "px-5 py-4 text-left font-heading text-sm font-semibold leading-snug text-[#031F82]"
                  }
                >
                  <InlineView nodes={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  rowIndex < rows.length - 1
                    ? "border-b border-[#E6EDF8] align-top"
                    : "align-top"
                }
              >
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <td
                      key={cellIndex}
                      className="w-[30%] whitespace-normal px-5 py-4 align-top font-sans leading-normal"
                    >
                      <FirstColumnLabel nodes={cell} />
                    </td>
                  ) : (
                    <td
                      key={cellIndex}
                      className="px-5 py-4 align-top font-sans text-[15px] font-normal leading-normal text-[#1E3A5F]"
                    >
                      <InlineView nodes={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlockView({
  block,
  afterHeading,
}: {
  block: PrivacyBlock;
  afterHeading: boolean;
}) {
  const topGap = afterHeading ? "mt-2" : "mt-4";

  if (block.kind === "h1") {
    return (
      <h1 className="font-heading text-3xl font-extrabold leading-tight text-[#031F82]">
        <InlineView nodes={block.children} />
      </h1>
    );
  }

  if (block.kind === "h2") {
    return (
      <h2 className="mt-8 font-heading text-xl font-extrabold leading-snug text-[#031F82]">
        <InlineView nodes={block.children} />
      </h2>
    );
  }

  if (block.kind === "ul") {
    return (
      <ul className={`${topGap} list-disc space-y-2 pl-5 ${bodyClass}`}>
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineView nodes={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === "table") {
    return (
      <TableView
        headers={block.headers}
        rows={block.rows}
        className={topGap}
      />
    );
  }

  return (
    <p className={`${topGap} ${bodyClass}`}>
      <InlineView nodes={block.children} />
    </p>
  );
}

export function PrivacyPolicyView({
  blocks,
}: {
  blocks: PrivacyBlock[];
}): ReactNode {
  return (
    <article className="font-sans text-base font-normal leading-normal text-[#1E3A5F]">
      {blocks.map((block, index) => (
        <BlockView
          key={index}
          block={block}
          afterHeading={blocks[index - 1]?.kind === "h2"}
        />
      ))}
    </article>
  );
}
