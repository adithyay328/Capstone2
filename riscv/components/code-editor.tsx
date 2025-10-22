"use client";
import React, { useMemo, useRef, useEffect } from "react";
import Editor from "react-simple-code-editor";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  fontSize?: number;
  className?: string;
  onRun?: () => void;
};

export default function CodeEditor({
  value,
  onChange,
  rows = 10,
  fontSize = 14,
  className = "",
  onRun,
}: Readonly<CodeEditorProps>) {
  // ----- Refs & constants -----
  const gutterRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didInitRef = useRef(false);

  const TEXTAREA_ID = "code-editor-textarea"; // react-simple-code-editor's textarea id

  const PADDING_PX = 8;            // keep in sync with <Editor padding>
  const LINE_HEIGHT_UNIT = 1.5;    // keep in sync with style.lineHeight
  const lineHeightPx = LINE_HEIGHT_UNIT * fontSize;

  // ----- Start with 10 lines and caret at beginning -----
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (value.length === 0) onChange("\n".repeat(9)); // 10 lines = 9 newlines

    // place caret at start on the next frame
    requestAnimationFrame(() => {
      withTextarea(TEXTAREA_ID, (ta) => {
        ta.focus();
        ta.setSelectionRange(0, 0);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Line numbers data -----
  const lineCount = useMemo(() => Math.max(1, value.split("\n").length), [value]);
  const lines = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  // =============================
  // Helpers (kept very straightforward)
  // =============================

  // Turn a caret index into a 0-based line number
  function caretIndexToLine(text: string, idx: number): number {
    if (idx <= 0) return 0;
    let line = 0;
    const last = Math.min(idx, text.length);
    for (let i = 0; i < last; i++) {
      if (text.charCodeAt(i) === 10 /* '\n' */) line++;
    }
    return line;
  }

  // Top Y position (px) of a given line, inside the content
  function lineToY(line: number): number {
    return PADDING_PX + line * lineHeightPx;
  }

  // Move caret to a line (start or end)
  function moveCaretToLine(lineNum: number, toLineEnd = false) {
    withTextarea(TEXTAREA_ID, (ta) => {
      const arr = value.split("\n");
      const safeIndex = Math.max(0, Math.min(lineNum - 1, arr.length - 1));

      // sum of previous line lengths + 1 '\n' per previous line
      let offset = 0;
      for (let i = 0; i < safeIndex; i++) offset += arr[i].length + 1;
      if (toLineEnd) offset += arr[safeIndex].length;

      ta.focus();
      ta.setSelectionRange(offset, offset);
    });
  }

  // Keep the caret's line visible
  function keepCaretVisible() {
    const sc = scrollRef.current;
    if (!sc) return;

    withTextarea(TEXTAREA_ID, (ta) => {
      const text = ta.value;
      const caretIdx = ta.selectionStart ?? 0;
      const caretLine = caretIndexToLine(text, caretIdx);
      const caretY = lineToY(caretLine);

      const margin = 20; // breathing room
      const topVisible = sc.scrollTop + margin;
      const bottomVisible = sc.scrollTop + sc.clientHeight - lineHeightPx - margin;

      if (caretY < topVisible) {
        sc.scrollTop = Math.max(0, caretY - margin);
      } else if (caretY > bottomVisible) {
        const target = caretY - (sc.clientHeight - lineHeightPx - margin);
        sc.scrollTop = Math.min(sc.scrollHeight - sc.clientHeight, target);
      }
    });
  }

  // Grow/shrink container to content, never below min height, and clamp scroll
  function resizeToContent() {
    const sc = scrollRef.current;
    if (!sc) return;

    const pre = sc.querySelector("pre") as HTMLElement | null; // rendered content
    const contentPx = (pre?.scrollHeight ?? 0) + PADDING_PX * 2;
    const minPx = rows * lineHeightPx + PADDING_PX * 2;
    const desired = Math.max(minPx, contentPx);
    sc.style.height = `${desired}px`; // max-h-[75vh] still caps final height

    // Clamp scrollTop so we don't show a gap after big deletes
    const maxScrollTop = Math.max(0, sc.scrollHeight - sc.clientHeight);
    if (sc.scrollTop > maxScrollTop) sc.scrollTop = maxScrollTop;
  }

  // =============================
  // Effects
  // =============================

  // Keep container sized to content on changes
  useEffect(() => {
    const id = requestAnimationFrame(resizeToContent);
    return () => cancelAnimationFrame(id);
  }, [value, fontSize, rows]);

  // Also fix size on window resize
  useEffect(() => {
    const onResize = () => requestAnimationFrame(resizeToContent);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Handle Enter key: always insert "\n" at caret (esp. in middle)
  useEffect(() => {
    const taForBinding = getTextarea(TEXTAREA_ID);
    if (!taForBinding) return;

    function onKeyDown(e: KeyboardEvent) {
      const isEnter = e.key === "Enter";
      const hasModifier = e.shiftKey || e.altKey || e.metaKey || e.ctrlKey;
      if (!isEnter || hasModifier) return;

      e.preventDefault(); // we handle Enter

      withTextarea(TEXTAREA_ID, (ta) => {
        const start = ta.selectionStart ?? value.length;
        const end = ta.selectionEnd ?? start;
        const updated = value.slice(0, start) + "\n" + value.slice(end);

        onChange(updated);

        requestAnimationFrame(() => {
          resizeToContent();
          const newPos = start + 1; // caret just after newline
          withTextarea(TEXTAREA_ID, (t2) => {
            t2.focus();
            t2.setSelectionRange(newPos, newPos);
          });
          keepCaretVisible();
        });
      });
    }

    taForBinding.addEventListener("keydown", onKeyDown);
    return () => taForBinding.removeEventListener("keydown", onKeyDown);
  }, [value, onChange, lineHeightPx]); // rebind if these change

  // =============================
  // Mouse handlers
  // =============================

  // If only one line exists, clicking anywhere focuses line 1 (end)
  const handleContainerMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (lineCount === 1) {
      e.preventDefault();
      moveCaretToLine(1, true);
    }
  };

  // Clicking a line number moves caret to that line (start)
  function handleLineClick(line: number, e: React.MouseEvent) {
    e.preventDefault();
    moveCaretToLine(line, false);
  }

  // =============================
  // Typing handler
  // - Only stick to bottom if user was at the very end AND was near the bottom
  // - Otherwise keep caret visible where they're editing
  // =============================
  function handleValueChange(next: string) {
    const sc = scrollRef.current;
    const prevCaret = getTextarea(TEXTAREA_ID)?.selectionStart ?? null;

    const wasAtEnd = prevCaret !== null && prevCaret === value.length;
    const nearBottom = !!sc && sc.scrollHeight - (sc.scrollTop + sc.clientHeight) < 40;

    onChange(next);

    requestAnimationFrame(() => {
      resizeToContent();
      if (wasAtEnd && nearBottom) {
        // true "typing at end" -> stick to bottom
        const s = scrollRef.current;
        if (s) s.scrollTop = s.scrollHeight;
      } else {
        keepCaretVisible(); // editing in the middle -> keep caret in view
      }
    });
  }

  // =============================
  // Simple highlighter: after first "#" on a line, make it gray
  // =============================
  function esc(s: string) {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function highlight(code: string) {
    const parts = code.split("\n");
    const out: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const line = parts[i];
      const idx = line.indexOf("#");
      if (idx === -1) {
        out.push(esc(line) || "&nbsp;");
      } else {
        const before = esc(line.slice(0, idx));
        const after = esc(line.slice(idx));
        out.push(`${before}<span style="color:#9CA3AF">${after}</span>`);
      }
    }
    return out.join("\n");
  }

  // =============================
  // Render
  // =============================
  return (
    <div className="pt-12 pb-5">
      <div
        className={`w-full h-auto md:w-[700px] lg:w-[800px] xl:w-[1000px] border-2 border-gray-900 rounded-2xl bg-white overflow-hidden ${className}`}
        style={{ lineHeight: LINE_HEIGHT_UNIT }}
      >
        {/* Shared scroll container so gutter + editor scroll together */}
        <div
          ref={scrollRef}
          className="relative flex items-stretch max-h-[75vh] overflow-auto"
          style={{
            lineHeight: LINE_HEIGHT_UNIT,
            // Gray gutter (3.25rem) + 1px divider, then transparent editor
            backgroundImage:
              "linear-gradient(to right, #f3f4f6 0, #f3f4f6 3.25rem, #e5e7eb 3.25rem, #e5e7eb calc(3.25rem + 1px), transparent calc(3.25rem + 1px))",
            backgroundAttachment: "local",
          }}
          onMouseDown={handleContainerMouseDown}
        >
          {/* Line numbers (transparent so the gradient shows) */}
          <div
            ref={gutterRef}
            className="flex-none select-none text-gray-500 px-3 py-2 text-right font-mono"
            style={{ fontSize, width: "3.25rem" }}
          >
            <div className="whitespace-pre leading-[1.5]">
              {lines.map((n) => (
                <div
                  key={n}
                  onMouseDown={(e) => handleLineClick(n, e)}
                  className="cursor-pointer hover:text-gray-700"
                >
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="relative flex-1">
            <Editor
              value={value}
              onValueChange={handleValueChange}
              highlight={highlight}
              padding={PADDING_PX}
              textareaId={TEXTAREA_ID}
              textareaClassName="outline-none"
              preClassName="font-mono"
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
                fontSize,
                whiteSpace: "pre",
                color: "#111827",
                lineHeight: LINE_HEIGHT_UNIT,
              }}
            />
          </div>
        </div>

        <RunCode onClick={onRun} />
      </div>
    </div>
  );
}

/* ===== Tiny, TS-safe DOM helpers ===== */
function getTextarea(id: string) {
  return document.getElementById(id) as HTMLTextAreaElement | null;
}
function withTextarea(id: string, fn: (ta: HTMLTextAreaElement) => void) {
  const ta = getTextarea(id);
  if (ta) fn(ta); // type-narrowed to non-null inside callback
}

/* ===== Button stays the same ===== */
function RunCode({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={() => onClick?.()} className="bg-black px-7 py-2 text-white rounded">
      Run
    </button>
  );
}
