import { useCallback, useEffect, useState } from "react";

/* ============================================
   useAdminFetch<T> — fetch tipado para el panel admin
   --------------------------------------------
   Reemplaza los tres `useEffect` de fetch duplicados del antiguo God component
   `admin/page.tsx` (guests / songs / messages) y los dos bloques inline de
   "Reintentar" (`.then(...).catch(...)` a mano en songs y messages).

   Contrato:
   - `enabled` controla cuándo correr la petición (sesión autenticada y/o pestaña
     activa). Mientras sea falsa, el efecto no hace nada y el último estado
     persiste (no se borra).
   - Las rutas `/api/admin/*` y `/api/songs` devuelven errores HTTP no-200 con un
     cuerpo `{ error: string }`. Aquí lanzamos si `!res.ok` para capturar el
     mensaje; el éxito deja el JSON ya parseado en `data`.
   - `retry()` incrementa un tick para forzar una re-petición sin recargar la
     página (reemplaza el `window.location.reload()` del estado de error previo).
   ============================================ */
export interface UseAdminFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useAdminFetch<T>(opts: {
  url: string;
  enabled?: boolean;
}): UseAdminFetchResult<T> {
  const { url, enabled = true } = opts;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const retry = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    // Los setState (pre-flight + cadena de la promesa) corren en un microtask,
    // no de forma sincrónica dentro del cuerpo del efecto: la regla
    // react-hooks/set-state-in-effect prohíbe setState sincrónico en el efecto
    // (provoca cascadas de re-render). El microtask difiere una iteración,
    // imperceptible para el UI.
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);

      fetch(url)
        .then(async (res) => {
          const json = (await res.json()) as T & { error?: string };
          if (!res.ok) {
            throw new Error(json.error || `API returned status ${res.status}`);
          }
          return json;
        })
        .then((json) => {
          if (!cancelled) setData(json);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("useAdminFetch error:", err);
          setError(err instanceof Error ? err.message : "Error cargando los datos");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [url, enabled, tick]);

  return { data, loading, error, retry };
}
