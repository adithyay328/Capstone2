import React, { useMemo, useRef, useEffect } from 'react';

/* template for our CodeEditor initialization*/
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
    className = '',
    onRun,
}: Readonly<CodeEditorProps>) {

    const lineNumRef = useRef<HTMLDivElement>(null); //Reference for line numbers column
    const textAreaRef = useRef<HTMLTextAreaElement>(null); //Reference for textarea
    
    const lineNumCount = useMemo(() => Math.max(1, value.split('\n').length), [value]);
    const lines = useMemo(() => Array.from({ length: lineNumCount }, (_, i) => i + 1), [lineNumCount]);

    useEffect(() => {
        const tArea = textAreaRef.current;
        if (!tArea) return;
        tArea.style.height = 'auto';
        tArea.style.height = `${tArea.scrollHeight}px`;
    }, [value, fontSize, rows]);

    //CONTAINER FOR THE WHOLE EDITOR
    return (
    <div className="w-full h-auto
                    md:w-[700px] lg:w-[800px] xl:w-[1000px]
                    border-2 border-gray-900 rounded-lg bg-white"
            style={{ lineHeight: "1.5" }}>

        <div className="flex items-stretch max-h-[75vh] overflow-y-auto">

            {/* make a column for line numbers */}
            <div ref={lineNumRef} 
                className="flex-none h-full select-none bg-gray-100 text-gray-500 
                            border-r border-black/10 px-3 py-2 text-right font-mono"
                style={{ fontSize, width: "3.25rem"}}
                aria-hidden="true"
            >
                <div className="whitespace-pre leading-[1.5]">
                    {lines.map(line => (
                        <div key={line}>{line}</div>
                    ))}
                </div>
            </div>

            {/* AREA FOR CODE EDITING */}
            <textarea ref={textAreaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                onScroll={
                    () => {
                        if (!lineNumRef.current || !textAreaRef.current) return;
                        lineNumRef.current.scrollTop = textAreaRef.current.scrollTop;
                        //lineNumRef.current.scrollLeft = textAreaRef.current.scrollLeft;
                    }
                }
                className="flex-1 p-2 font-mono text-gray-900 outline-none resize-none"
                style={{ fontSize, minHeight: `${rows * 1.5 * (fontSize / 14)}rem`, overflow: 'hidden'}}
                placeholder="Write your code here..."
            />
        </div>
                <RunCode onClick={onRun} />
    </div>
  );
}

function RunCode({
    onClick
}: { onClick?: () => void}) {

    function handleClick() {
        alert("RUN button clicked!");
        onClick?.();
    }

    return (
        <button 
            onClick={handleClick}
            className="rounded bg-black px-7 py-2 text-white">
                Run
        </button>
    );
}