"use client";
import React from "react";
import CodeEditor from "./code-editor";

type EditorPanelProps = {
  projectName: string;
  projectDescription?: string;
  code: string;
  onCodeChange: (nextCode: string) => void;
};

const EditorPanel: React.FC<EditorPanelProps> = ({
  projectName,
  projectDescription,
  code,
  onCodeChange,
}) => {
  return (
    <>
      <div className="mb-2">
        <div className="text-xs font-semibold text-zinc-200">{projectName}</div>
        {projectDescription && (
          <div className="text-[11px] text-zinc-400 truncate">
            {projectDescription}
          </div>
        )}
      </div>

      {/* EDITOR */}
      <CodeEditor code={code} onChange={onCodeChange} />
    </>
  );
};

export default EditorPanel;
