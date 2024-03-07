import { createContext, createElement, useCallback, useContext, useState } from 'react';

function updateObject(oldObject, newValues) {
  return Object.entries(newValues).reduce(
    (newState, [key, val]) =>
      SYNTHETIX_STATE_KEYS.includes(key) && newState[key] !== val
        ? Object.assign(newState, { [key]: val })
        : newState,
    Object.assign({}, oldObject)
  );
}

const SYNTHETIX_INITIAL_STATE = Object.freeze({
  walletAddress: undefined,
  connect: () => {},
  signature: undefined,
});

export const SYNTHETIX_STATE_KEYS = Object.keys(SYNTHETIX_INITIAL_STATE);
const SynthetixContext = createContext([SYNTHETIX_INITIAL_STATE, () => {}]);

export function SynthetixProvider({ children, ...props }) {
  const [state, setState] = useState(updateObject(SYNTHETIX_INITIAL_STATE, props));
  return createElement(SynthetixContext.Provider, { value: [state, setState] }, children);
}

export function useSynthetix() {
  const [state, setState] = useContext(SynthetixContext);
  const updateState = useCallback((updates) =>
    setState((oldState) => updateObject(oldState, updates))
  );
  return [state, updateState];
}
