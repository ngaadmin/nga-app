import type { ReactNode } from "react";
import type {
  InlineNode,
  PrivacyBlock,
} from "@/lib/privacy/parse-privacy-markdown";
import { safePolicyHref } from "@/lib/privacy/parse-privacy-markdown";

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
      <strong className="font-bold text-[#031F82]">
        <InlineView nodes={node.children} />
      </strong>
    );
  }
  if (node.kind === "em") {
    return (
      <em>
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

const bodyClass = "font-sans text-base leading-relaxed text-[#1E3A5F]";

function TableView({
  headers,
  rows,
}: {
  headers: InlineNode[][];
  rows: InlineNode[][][];
}) {
  return (
    <div className="mt-4">
      <div className="space-y-3 md:hidden">
        <div className={bodyClass}>
          {headers.map((header, index) => (
            <p key={index} className="font-heading font-bold text-[#031F82]">
              <InlineView nodes={header} />
            </p>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <section
            key={rowIndex}
            className="rounded-nga-lg border border-nga-mist p-4"
          >
            {row.map((cell, cellIndex) => (
              <p
                key={cellIndex}
                className={
                  cellIndex === 0
                    ? "font-heading text-base font-bold leading-snug text-[#031F82]"
                    : `mt-2 ${bodyClass}`
                }
              >
                <InlineView nodes={cell} />
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className={`w-full border-collapse text-left ${bodyClass}`}>
          <thead>
            <tr className="border-b border-nga-mist">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-3 font-heading text-base font-bold text-[#031F82]"
                >
                  <InlineView nodes={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-nga-mist align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-3">
                    <InlineView nodes={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlockView({ block }: { block: PrivacyBlock }) {
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
      <ul className={`mt-4 list-disc space-y-2 pl-5 ${bodyClass}`}>
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineView nodes={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === "table") {
    return <TableView headers={block.headers} rows={block.rows} />;
  }

  return (
    <p className={`mt-4 ${bodyClass}`}>
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
    <article>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </article>
  );
}
