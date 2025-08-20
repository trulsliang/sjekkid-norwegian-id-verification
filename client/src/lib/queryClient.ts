import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createApiUrl } from "@/config/api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clear invalid session on 401
    if (res.status === 401) {
      localStorage.removeItem('adminSessionId');
      localStorage.removeItem('adminUser');
    }
    
    let errorMessage = res.statusText;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        errorMessage = json.message || json.error || errorMessage;
      } else {
        const text = await res.text();
        // If it's HTML, extract a meaningful error message
        if (text.includes('<!DOCTYPE')) {
          errorMessage = `Server error (${res.status})`;
        } else {
          errorMessage = text || errorMessage;
        }
      }
    } catch {
      // Fallback if response parsing fails
      errorMessage = `HTTP ${res.status}`;
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  additionalHeaders?: Record<string, string>,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(additionalHeaders || {}),
  };

  // Add session token if available
  const sessionId = localStorage.getItem('adminSessionId');
  if (sessionId) {
    headers.Authorization = `Bearer ${sessionId}`;
  }

  const res = await fetch(createApiUrl(url), {
    method,
    headers,
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
  async ({ queryKey, meta }) => {
    const headers: Record<string, string> = {
      ...(meta?.headers || {}),
    };

    // Add session token if available
    const sessionId = localStorage.getItem('adminSessionId');
    if (sessionId) {
      headers.Authorization = `Bearer ${sessionId}`;
    }

    const res = await fetch(createApiUrl(queryKey.join("/") as string), {
      credentials: "include",
      headers,
    });

    if (res.status === 401) {
      // Clear invalid session on 401
      localStorage.removeItem('adminSessionId');
      localStorage.removeItem('adminUser');
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    await throwIfResNotOk(res);
    
    // Safe JSON parsing - handle non-JSON responses
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      } else {
        // Return empty object for non-JSON responses
        return {};
      }
    } catch (error) {
      console.error('JSON parsing error:', error);
      return {};
    }
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
