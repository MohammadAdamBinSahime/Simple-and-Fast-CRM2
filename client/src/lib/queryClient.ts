import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class TrialExpiredError extends Error {
  constructor() {
    super("Your free trial has ended. Please subscribe to add, edit, or delete data.");
    this.name = "TrialExpiredError";
  }
}

export function isTrialExpiredError(error: unknown): error is TrialExpiredError {
  return error instanceof TrialExpiredError;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TrialExpiredError) {
    return error.message;
  }
  return fallback;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Check for trial expired error
    try {
      const json = JSON.parse(text);
      if (json.code === "TRIAL_EXPIRED") {
        throw new TrialExpiredError();
      }
    } catch (e) {
      if (e instanceof TrialExpiredError) throw e;
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
