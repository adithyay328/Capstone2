"use client";
import React from "react";
type EditorControlsProps = {
  onRun: () => void;
  onStart: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSyncNow?: () => void;
  uid?: string;
  stepsEngaged: boolean;
  stepIndex: number;
  allStatesLength: number;
};

const EditorControls: React.FC<EditorControlsProps> = ({
  onRun,
  onStart,
  onStop,
  onStepForward,
  onStepBack,
  onReset,
  onSyncNow,
  uid,
  stepsEngaged,
  stepIndex,
  allStatesLength,
}) => {
  return (
    <div className="flex flex-wrap gap-3 items-center mt-5">
      <button
        onClick={onRun}
        className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-900 disabled:opacity-50"
      >
        Run
      </button>

      {stepsEngaged ? (
        <button
          onClick={onStop}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={onStart}
          className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Start
        </button>
      )}

      <button
        onClick={onStepForward}
        className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
        disabled={!stepsEngaged || allStatesLength === 0 || stepIndex >= allStatesLength - 1}
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
        {onSyncNow ? (
          <button
            onClick={onSyncNow}
            className="rounded border px-3 py-2 text-xs hover:bg-zinc-100"
          >
            Sync Now
          </button>
        ) : null}
        {uid ? <span className="text-xs text-zinc-500">{uid}</span> : null}
      </div>
    </div>
  );
};

export default EditorControls;
