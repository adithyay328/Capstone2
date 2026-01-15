"use client";
import React from "react";
import type {
  AssemblyInfoData,
  ProjectState,
  SubmitRequest,
  SubmitResponse,
} from "./types";

type RunMeta = { hadError: boolean; errorMessage: string };

type UseRunnerParams = {
  code: string;
  allStates: SubmitResponse["states"];
  runMeta: RunMeta;
  persist: (next?: Partial<ProjectState>) => void;
  setAllStates: React.Dispatch<React.SetStateAction<SubmitResponse["states"]>>;
  setStepIndex: React.Dispatch<React.SetStateAction<number>>;
  setResp: React.Dispatch<React.SetStateAction<AssemblyInfoData | null>>;
  setRunMeta: React.Dispatch<React.SetStateAction<RunMeta>>;
  setFatalError: React.Dispatch<React.SetStateAction<string | null>>;
  setStepsEngaged: React.Dispatch<React.SetStateAction<boolean>>;
};

const useRunner = ({
  code,
  allStates,
  runMeta,
  persist,
  setAllStates,
  setStepIndex,
  setResp,
  setRunMeta,
  setFatalError,
  setStepsEngaged,
}: UseRunnerParams) => {
  const runBackend = React.useCallback(async (): Promise<{
    states: SubmitResponse["states"];
    hadError: boolean;
    errorMessage: string;
  } | null> => {
    try {
      const reqBody: SubmitRequest = {
        code,
        registers: {}, // TODO: fill from user input later
        memory: {}, // TODO: fill from user input later
      };

      const res = await fetch("/api/run", {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(await res.text());

      const json = (await res.json()) as Partial<SubmitResponse>;

      // 1. Guard: make sure states is a non-empty array
      if (!Array.isArray(json.states) || json.states.length === 0) {
        setAllStates([]);
        setStepIndex(0);

        const assemblyData: AssemblyInfoData = {
          hadError: !!json.hadError,
          errorMessage: json.errorMessage ?? "Backend returned no states",
          registers: {},
          memory: {},
        };

        setRunMeta({
          hadError: assemblyData.hadError,
          errorMessage: assemblyData.errorMessage,
        });
        setResp(assemblyData);

        persist({
          allStates: [],
          stepIndex: 0,
          resp: assemblyData,
        });

        return null;
      }

      // 2. Normal case: we have at least one state
      const states = json.states;

      setAllStates(states);
      setStepIndex(0);
      setRunMeta({
        hadError: !!json.hadError,
        errorMessage: json.errorMessage ?? "",
      });

      // persist step-related stuff
      persist({
        allStates: states,
        stepIndex: 0,
      });

      return {
        states,
        hadError: !!json.hadError,
        errorMessage: json.errorMessage ?? "",
      };
    } catch (e: any) {
      setFatalError(e?.message ?? "Run failed");
      return null;
    }
  }, [
    code,
    persist,
    setAllStates,
    setStepIndex,
    setResp,
    setRunMeta,
    setFatalError,
  ]);

  const handleRun = React.useCallback(async () => {
    const result = await runBackend();
    if (!result) return;

    const { states, hadError, errorMessage } = result;

    // show the final state (same as before)
    const finalState = states[states.length - 1]!;

    const assemblyData: AssemblyInfoData = {
      hadError,
      errorMessage,
      registers: finalState.registers,
      memory: finalState.memory,
    };

    setResp(assemblyData);
    setStepsEngaged(false);

    // persist current view (states + stepIndex already persisted in runBackend)
    persist({
      resp: assemblyData,
    });
  }, [persist, runBackend, setResp, setStepsEngaged]);

  const resetSession = React.useCallback(() => {
    setAllStates([]);
    setStepIndex(0);
    setResp(null);
    persist({
      allStates: [],
      stepIndex: 0,
      resp: null,
    });
  }, [persist, setAllStates, setResp, setStepIndex]);

  const handleStepForward = React.useCallback(() => {
    setStepIndex((idx) => {
      const next = Math.min(idx + 1, allStates.length - 1);
      const nextState = allStates[next];
      if (nextState) {
        const newResp = {
          hadError: runMeta.hadError,
          errorMessage: runMeta.errorMessage,
          registers: nextState.registers,
          memory: nextState.memory,
        };
        setResp(newResp);
        persist({ resp: newResp });
        // also update simState / highlighting if needed
      }
      return next;
    });
  }, [allStates, persist, runMeta, setResp, setStepIndex]);

  const handleStepBack = React.useCallback(() => {
    setStepIndex((idx) => {
      const prev = Math.max(idx - 1, 0);
      const prevState = allStates[prev];
      if (prevState) {
        const newResp = {
          hadError: runMeta.hadError,
          errorMessage: runMeta.errorMessage,
          registers: prevState.registers,
          memory: prevState.memory,
        };
        setResp(newResp);
        persist({ resp: newResp });
        // also update simState / highlighting if needed
      }
      return prev;
    });
  }, [allStates, persist, runMeta, setResp, setStepIndex]);

  const handleStart = React.useCallback(async () => {
    let statesToUse = allStates;
    let hadError = runMeta.hadError;
    let errorMessage = runMeta.errorMessage;

    // If we don't have states yet, call backend now
    if (statesToUse.length === 0) {
      const result = await runBackend();
      if (!result) return; // error or no states already handled inside runBackend

      statesToUse = result.states;
      hadError = result.hadError;
      errorMessage = result.errorMessage;
    }

    if (statesToUse.length === 0) return; // extra guard

    const firstState = statesToUse[0];

    const newResp: AssemblyInfoData = {
      hadError,
      errorMessage,
      registers: firstState.registers,
      memory: firstState.memory,
    };

    setStepIndex(0);
    setResp(newResp);
    setStepsEngaged(true);

    persist({ resp: newResp, stepIndex: 0 });
  }, [
    allStates,
    persist,
    runBackend,
    runMeta,
    setResp,
    setStepIndex,
    setStepsEngaged,
  ]);

  return {
    handleRun,
    handleStart,
    handleStepForward,
    handleStepBack,
    resetSession,
  };
};

export default useRunner;
