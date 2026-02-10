const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export async function fetchFromAPI<T>(
  path: string,
  options?: { revalidate?: number | false; cache?: RequestCache }
): Promise<T | null> {
  try {
    const fetchOptions: RequestInit & { next?: { revalidate: number | false } } = {};

    if (options?.cache) {
      fetchOptions.cache = options.cache;
    } else if (options?.revalidate !== undefined) {
      fetchOptions.next = { revalidate: options.revalidate };
    } else {
      fetchOptions.next = { revalidate: 300 };
    }

    const res = await fetch(`${API_BASE}${path}`, fetchOptions);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}
