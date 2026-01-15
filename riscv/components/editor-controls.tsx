"use client";
import React from "react";
type EditorControlsProps = {
  onRun: () => void;
  onStart: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  uid: string;
  stepsEngaged: boolean;
  stepIndex: number;
  allStatesLength: number;
};

const EditorControls: React.FC<EditorControlsProps> = ({
  onRun,
  onStart,
  onStepForward,
  onStepBack,
  onReset,
  uid,
  stepsEngaged,
  stepIndex,
  allStatesLength,
}) => {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <button
        onClick={onRun}
        className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-900 disabled:opacity-50"
      >
        Run
      </button>

      <button
        onClick={onStart}
        className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
      >
        Start
      </button>

      <button
        onClick={onStepForward}
        className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
        disabled={!stepsEngaged || allStatesLength === 0}
      >
        Step
      </button>

      <button
        onClick={onStepBack}
        className="rounded border px-4 py-2 hover:bg-zinc-100 disabled:opacity-50"
        disabled={!stepsEngaged || stepIndex === 0 || allStatesLength === 0}
      >
        Back Step
      </button>

      <button
        onClick={onReset}
        className="rounded border px-4 py-2 hover:bg-zinc-100 disabled:opacity-50"
      >
        Reset
      </button>

      <div className="flex flex-wrap gap-3 items-center ml-auto">
        <span className="text-xs text-zinc-500">{uid}</span>
      </div>
    </div>
  );
};

export default EditorControls;
