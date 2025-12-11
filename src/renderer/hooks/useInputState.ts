import { useCallback } from 'react';
import {
  useStore,
  getInputMode,
  defaultSessionInputState,
  type InputMode,
  type PlanMode,
  type ThinkingLevel,
} from '../store';

export interface InputState {
  value: string;
  cursorPosition: number;
  mode: InputMode;
}

export function useInputState(
  sessionId: string | null,
  workspaceId: string | null,
) {
  const {
    getSessionInput,
    setSessionInput,
    resetSessionInput,
    addToWorkspaceHistory,
    getWorkspaceHistory,
  } = useStore();

  const sessionInput = sessionId
    ? getSessionInput(sessionId)
    : defaultSessionInputState;
  const history = workspaceId ? getWorkspaceHistory(workspaceId) : [];

  const state: InputState = {
    value: sessionInput.value,
    cursorPosition: sessionInput.cursorPosition,
    mode: getInputMode(sessionInput.value),
  };

  const setValue = useCallback(
    (newValue: string) => {
      if (sessionId) {
        setSessionInput(sessionId, { value: newValue });
      }
    },
    [sessionId, setSessionInput],
  );

  const setCursorPosition = useCallback(
    (pos: number) => {
      if (sessionId) {
        setSessionInput(sessionId, { cursorPosition: pos });
      }
    },
    [sessionId, setSessionInput],
  );

  const reset = useCallback(() => {
    if (sessionId) {
      resetSessionInput(sessionId);
    }
  }, [sessionId, resetSessionInput]);

  // History helpers
  const historyIndex = sessionInput.historyIndex;
  const draftInput = sessionInput.draftInput;

  const setHistoryIndex = useCallback(
    (index: number | null) => {
      if (sessionId) {
        setSessionInput(sessionId, { historyIndex: index });
      }
    },
    [sessionId, setSessionInput],
  );

  const setDraftInput = useCallback(
    (input: string) => {
      if (sessionId) {
        setSessionInput(sessionId, { draftInput: input });
      }
    },
    [sessionId, setSessionInput],
  );

  const addToHistory = useCallback(
    (input: string) => {
      if (workspaceId) {
        addToWorkspaceHistory(workspaceId, input);
      }
    },
    [workspaceId, addToWorkspaceHistory],
  );

  // Plan mode and thinking
  const planMode = sessionInput.planMode;
  const thinking = sessionInput.thinking;
  const thinkingEnabled = sessionInput.thinkingEnabled;

  const togglePlanMode = useCallback(() => {
    if (sessionId) {
      const newMode: PlanMode =
        planMode === 'normal'
          ? 'plan'
          : planMode === 'plan'
            ? 'brainstorm'
            : 'normal';
      setSessionInput(sessionId, { planMode: newMode });
    }
  }, [sessionId, planMode, setSessionInput]);

  const toggleThinking = useCallback(() => {
    if (sessionId && thinkingEnabled) {
      const newThinking: ThinkingLevel =
        thinking === null
          ? 'low'
          : thinking === 'low'
            ? 'medium'
            : thinking === 'medium'
              ? 'high'
              : null;
      setSessionInput(sessionId, { thinking: newThinking });
    }
  }, [sessionId, thinking, thinkingEnabled, setSessionInput]);

  const setThinkingEnabled = useCallback(
    (enabled: boolean) => {
      if (sessionId) {
        setSessionInput(sessionId, { thinkingEnabled: enabled });
      }
    },
    [sessionId, setSessionInput],
  );

  const setThinking = useCallback(
    (level: ThinkingLevel) => {
      if (sessionId) {
        setSessionInput(sessionId, { thinking: level });
      }
    },
    [sessionId, setSessionInput],
  );

  // Pasted text and image maps
  const pastedTextMap = sessionInput.pastedTextMap;
  const pastedImageMap = sessionInput.pastedImageMap;

  const setPastedTextMap = useCallback(
    (map: Record<string, string>) => {
      if (sessionId) {
        setSessionInput(sessionId, { pastedTextMap: map });
      }
    },
    [sessionId, setSessionInput],
  );

  const setPastedImageMap = useCallback(
    (map: Record<string, string>) => {
      if (sessionId) {
        setSessionInput(sessionId, { pastedImageMap: map });
      }
    },
    [sessionId, setSessionInput],
  );

  return {
    state,
    setValue,
    setCursorPosition,
    reset,
    // History
    history,
    historyIndex,
    draftInput,
    setHistoryIndex,
    setDraftInput,
    addToHistory,
    // Plan mode and thinking
    planMode,
    thinking,
    thinkingEnabled,
    togglePlanMode,
    toggleThinking,
    setThinkingEnabled,
    setThinking,
    // Pasted maps
    pastedTextMap,
    pastedImageMap,
    setPastedTextMap,
    setPastedImageMap,
  };
}
