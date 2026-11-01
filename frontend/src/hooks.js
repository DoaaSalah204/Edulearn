import { useCallback, useEffect, useRef, useState } from "react";

/** Load data from the API; returns { data, loading, error, reload, setData } */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fnRef.current().then((data) => alive && setState({ data, loading: false, error: "" }))
      .catch((e) => alive && setState({ data: null, loading: false, error: e.message || "Something went wrong" }));
    return () => { alive = false; };
  }, []); // eslint-disable-line
  useEffect(() => run(), [...deps]); // eslint-disable-line
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}

export function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v;
}
