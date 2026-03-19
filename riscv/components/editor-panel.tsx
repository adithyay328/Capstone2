"use client";
import React from "react";
import CodeEditor from "./code-editor";

type EditorPanelProps = {
  projectName: string;
  projectDescription?: string;
  code: string;
  onCodeChange: (nextCode: string) => void;
  showHeader?: boolean;
  editorFontSize?: number;
};

const EditorPanel: React.FC<EditorPanelProps> = ({
  projectName,
  projectDescription,
  code,
  onCodeChange,
  showHeader = true,
  editorFontSize,
}) => {
  return (
    <>
      {showHeader && (
        <div className="mb-2">
          <div className="text-xs font-semibold text-zinc-200">{projectName}</div>
          {projectDescription && (
            <div className="text-[11px] text-zinc-400 truncate">
              {projectDescription}
            </div>
          )}
        </div>
      )}

      {/* EDITOR */}
      <CodeEditor code={code} onChange={onCodeChange} fontSize={editorFontSize} />
    </>
  );
};

export default EditorPanel;
