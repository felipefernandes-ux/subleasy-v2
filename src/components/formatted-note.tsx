import { Fragment } from "react";
import { parseInline, parseNote } from "@/lib/note-format";

function Inline({ text }: { text: string }) {
  return parseInline(text).map((span, index) => (span.bold ? <strong key={index} className="font-bold text-ink-900">{span.text}</strong> : <Fragment key={index}>{span.text}</Fragment>));
}

/** Nota da equipe com parágrafos, listas e negrito (ver lib/note-format). */
export function FormattedNote({ note, className = "" }: { note: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {parseNote(note).map((block, index) =>
        block.type === "p" ? (
          <p key={index} className="whitespace-pre-line">
            <Inline text={block.text} />
          </p>
        ) : block.type === "ul" ? (
          <ul key={index} className="list-disc space-y-1 pl-5">
            {block.items.map((item, i) => (
              <li key={i}><Inline text={item} /></li>
            ))}
          </ul>
        ) : (
          <ol key={index} className="list-decimal space-y-1 pl-5">
            {block.items.map((item, i) => (
              <li key={i}><Inline text={item} /></li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}
