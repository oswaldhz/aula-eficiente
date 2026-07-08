import { useState, useEffect } from "react";
import { useFetch } from "../api";

export function useResource(endpoint, deps = []) {
  const { fetchData } = useFetch();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchData(endpoint)
      .then((r) => {
        if (!cancelled) {
          setData(Array.isArray(r) ? r : []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = () => fetchData(endpoint).then((r) => setData(Array.isArray(r) ? r : []));

  return { data, isLoading, error, refetch };
}
