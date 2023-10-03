import * as React from "react";

/** Return a Context Provider, and a hook to use it. */
export function createContext<T extends object | null>(defaultContext?: T) {
  const Context = React.createContext<T>(defaultContext);

  function useContext() {
    const context = React.useContext(Context);

    if (!context) {
      throw new Error(`Context has to be used within <Context.Provider>`);
    }
    return context;
  }
  function Provider(props: T & { children: React.ReactNode }) {
    const { children, ...context } = props;

    return <Context.Provider value={context as T}>{children}</Context.Provider>;
  }
  return [Provider, useContext] as const;
}
