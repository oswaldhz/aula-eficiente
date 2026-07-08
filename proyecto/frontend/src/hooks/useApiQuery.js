import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetch } from "../api";

export function useApiQuery(endpoint, options = {}) {
  const { fetchData } = useFetch();
  const queryKey = options.queryKey || [endpoint];
  return useQuery({
    queryKey,
    queryFn: () => fetchData(endpoint),
    select: (data) => Array.isArray(data) ? data : [],
    ...options,
  });
}

export function useApiMutation(method, options = {}) {
  const { postData, putData, deleteData } = useFetch();
  const queryClient = useQueryClient();

  const mutationFn = async ({ endpoint, data }) => {
    switch (method) {
      case "POST": return postData(endpoint, data);
      case "PUT": return putData(endpoint, data);
      case "DELETE": return deleteData(endpoint);
      default: throw new Error(`Unsupported method: ${method}`);
    }
  };

  return useMutation({
    mutationFn,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries();
      options.onSuccess?.(data, variables, context);
    },
  });
}
