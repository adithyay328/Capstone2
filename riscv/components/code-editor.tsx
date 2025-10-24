"use client";
import React, { useRef, useCallback } from "react";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";

const rangeAt = (pos: monaco.Position): monaco.IRange => ({
  startLineNumber: pos.lineNumber,
  endLineNumber: pos.lineNumber,
  startColumn: pos.column,
  endColumn: pos.column,
});




type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  fontSize?: number;
  className?: string;
  onRun?: () => void;
  currentLine?: number;
};

const abiToReg: Record<string, string> = {
  zero: "x0",
  ra: "x1",
  sp: "x2",
  gp: "x3",
  tp: "x4",
  t0: "x5",
  t1: "x6",
  t2: "x7",
  s0: "x8",
  fp: "x8",
  s1: "x9",
  a0: "x10",
  a1: "x11",
  a2: "x12",
  a3: "x13",
  a4: "x14",
  a5: "x15",
  a6: "x16",
  a7: "x17",
  s2: "x18",
  s3: "x19",
  s4: "x20",
  s5: "x21",
  s6: "x22",
  s7: "x23",
  s8: "x24",
  s9: "x25",
  s10: "x26",
  s11: "x27",
  t3: "x28",
  t4: "x29",
  t5: "x30",
  t6: "x31",
};

const regToAbi: Record<string, string> = Object.fromEntries(
  Object.entries(abiToReg).map(([abi, reg]) => [reg, abi])
);

const abiRole: Record<string, string> = {
  zero: "hard-wired zero",
  ra: "return address (caller-saved)",
  sp: "stack pointer (callee-saved)",
  gp: "global pointer",
  tp: "thread pointer",
  t0: "temporary (caller-saved)",
  t1: "temporary (caller-saved)",
  t2: "temporary (caller-saved)",
  s0: "saved/frame pointer (callee-saved)",
  fp: "frame pointer (alias of s0)",
  s1: "saved (callee-saved)",
  a0: "arg/ret (caller-saved)",
  a1: "arg/ret (caller-saved)",
  a2: "arg (caller-saved)",
  a3: "arg (caller-saved)",
  a4: "arg (caller-saved)",
  a5: "arg (caller-saved)",
  a6: "arg (caller-saved)",
  a7: "arg (caller-saved)",
  s2: "saved (callee-saved)",
  s3: "saved (callee-saved)",
  s4: "saved (callee-saved)",
  s5: "saved (callee-saved)",
  s6: "saved (callee-saved)",
  s7: "saved (callee-saved)",
  s8: "saved (callee-saved)",
  s9: "saved (callee-saved)",
  s10: "saved (callee-saved)",
  s11: "saved (callee-saved)",
  t3: "temporary (caller-saved)",
  t4: "temporary (caller-saved)",
  t5: "temporary (caller-saved)",
  t6: "temporary (caller-saved)",
};


export function normalizeRiscVCode(code: string): string {
  // matches abi names to reg
  return code.replace(
    /\b(zero|ra|sp|gp|tp|t[0-6]|s([0-9]|1[01])|a[0-7]|fp)\b/g,
    (match) => abiToReg[match] || match
  );
}

export default function CodeEditor({
  value,
  onChange,
  rows = 18,
  fontSize = 14,
  className = "",
  onRun,
  currentLine,
}: Readonly<CodeEditorProps>) {


  const registeredRef = useRef(false);
const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const monacoRef = useRef<typeof monaco | null>(null);
const decorationsRef = useRef<string[]>([]);
  const handleBeforeMount: BeforeMount = (m) => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    m.languages.register({ id: "riscv" });

    m.languages.setMonarchTokensProvider("riscv", {
      defaultToken: "",
      ignoreCase: true,
      tokenizer: {
        root: [
          [/#.*$/, "comment"],
          [/;.*$/, "comment"],
          [/^[ \t]*[A-Za-z_.$][\w.$]*:/, "type.identifier"],
          [/\b(x([0-9]|[12][0-9]|3[01])|zero|ra|sp|gp|tp|t[0-6]|s([0-9]|1[01])|a[0-7])\b/, "variable.predefined"],
          [/\b0x[0-9a-fA-F]+\b/, "number.hex"],
          [/\b-?\d+\b/, "number"],
          [/\.[A-Za-z_][\w.]*/, "keyword"],
          [
            /\b(sll|slli|srl|srli|sra|srai|add|sub|addi|lui|auipc|xor|or|and|xori|ori|andi|slt|slti|sltiu|sltu|beq|bne|blt|bge|bltu|bgeu|jal|jalr|fence|fence\.i|ecall|ebreak|lw|lh|lhu|lb|lbu|sw|sh|sb)\b/,
            "keyword.operator",
          ],
          [/[A-Za-z_.$][\w.$]*/, "identifier"],
          [/[,:()\[\]]/, "delimiter"],
          [/[+\-*/%&|^~!=<>]/, "operator"],
          [/[ \t\r\n]+/, ""],
        ],
      },
    });

    m.languages.setLanguageConfiguration("riscv", {
      comments: { lineComment: "#" },
      wordPattern: /[#@\-]?\w+(\.\w+)*/g,
    });

m.languages.registerCompletionItemProvider("riscv", {
  provideCompletionItems: (model, position) => {
    const range = rangeAt(position);

    const opcodeLabels = [
      "sll","slli","srl","srli","sra","srai","add","sub","addi","lui",
      "auipc","xor","or","and","xori","ori","andi","slt","slti","sltiu",
      "sltu","beq","bne","blt","bge","bltu","bgeu","jal","jalr","fence",
      "fence.i","ecall","ebreak","lw","lh","lhu","lb","lbu","sw","sh","sb",
    ];
    const abiLabels = Object.keys(abiToReg);
    const xLabels = Array.from({ length: 32 }, (_, i) => `x${i}`);

    const suggestions: monaco.languages.CompletionItem[] = [
      ...opcodeLabels.map((k) => ({
        label: k,
        kind: m.languages.CompletionItemKind.Keyword,
        insertText: k,
        range,
      })),
      ...abiLabels.map((abi) => ({
        label: abi,
        kind: m.languages.CompletionItemKind.Variable,
        insertText: abi,
        detail: `${abiToReg[abi]} • ${abiRole[abi] ?? ""}`,
        documentation: `${abi} = ${abiToReg[abi]} (${abiRole[abi] ?? "ABI register"})`,
        range,
      })),
      ...xLabels.map((x) => ({
        label: x,
        kind: m.languages.CompletionItemKind.Variable,
        insertText: x,
        detail: `${regToAbi[x] ?? ""}${regToAbi[x] ? " • " : ""}${abiRole[regToAbi[x] ?? ""] ?? ""}`,
        documentation: `${x}${regToAbi[x] ? ` = ${regToAbi[x]} (${abiRole[regToAbi[x]] ?? "register"})` : ""}`,
        range,
      })),
    ];

    return { suggestions };
  },
  triggerCharacters: [".", "x", "a", "s", "t", "r", "g", "z", "f"],
});


    m.languages.registerHoverProvider("riscv", {
      provideHover(model, position) {
        const word = model.getWordAtPosition(position);
        if (!word) return { contents: [] };
        const w = word.word;
        if (abiToReg[w]) {
          const x = abiToReg[w];
          const role = abiRole[w] ?? "ABI register";
          return { contents: [{ value: `**${w}**  \`${x}\`` }, { value: role }] };
        }
        if (/^x([0-9]|[12][0-9]|3[01])$/.test(w)) {
          const abi = regToAbi[w];
          const role = abi ? (abiRole[abi] ?? "register") : "register";
          return { contents: [{ value: `**${w}**${abi ? `  \`${abi}\`` : ""}` }, { value: role }] };
        }
        return { contents: [] };
      },
    });

    m.editor.defineTheme("riscv-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" },
        { token: "keyword.operator", foreground: "C586C0" },
        { token: "keyword", foreground: "569CD6" },
        { token: "type.identifier", foreground: "DCDCAA" },
        { token: "variable.predefined", foreground: "4FC1FF" },
        { token: "number", foreground: "B5CEA8" },
        { token: "number.hex", foreground: "B5CEA8" },
      ],
      colors: {},
    });
  };

const handleOnMount: OnMount = (editor, m) => {
  editorRef.current = editor;
  monacoRef.current = m;
  editor.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, () => onRun?.());
};


  const handleChange = useCallback((v?: string) => onChange(v ?? ""), [onChange]);

  const lineHeight = 22;
  const height = `${Math.max(8, rows) * lineHeight + 40}px`;

React.useEffect(() => {
  const ed = editorRef.current;
  const m = monacoRef.current;
  if (!ed || !m || !currentLine) return;

  const newDecos: monaco.editor.IModelDeltaDecoration[] = [
    {
      range: new m.Range(currentLine, 1, currentLine, 1),
      options: {
        isWholeLine: true,
        className: "riscv-current-line",
        linesDecorationsClassName: "riscv-line-gutter",
      },
    },
  ];

  decorationsRef.current = ed.deltaDecorations(decorationsRef.current, newDecos);
  ed.revealLineInCenterIfOutsideViewport(currentLine, 0);
}, [currentLine]);

return (
  <div className={`relative w-full pr-20 ${className}`}>
        <Editor
          width="100%"
          height={height}
          language="riscv"
          theme="riscv-dark"
          value={value}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleOnMount}
          options={{
            fontSize,
            fontLigatures: true,
            minimap: { enabled: false },
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "off",
            scrollBeyondLastLine: true,
            renderWhitespace: "none",
            smoothScrolling: true,
            glyphMargin: false,
            lineNumbersMinChars: 3,
            lineDecorationsWidth: 0,
            scrollbar: { horizontal: "visible" }, // force a visible bar
          }}
          className="rounded-xl overflow-y-hidden border-orange-300 border-2"
        />
  </div>
);

}
