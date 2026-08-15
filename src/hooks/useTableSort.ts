import { useCallback, useState } from "react";

/* ============================================
   useTableSort<T> — ordenamiento de tablas admin
   --------------------------------------------
   Hook genérico reutilizable para ordenar una
   lista de filas por una columna clave. Devuelve
   la clave activa, la dirección y un `sortBy` que
   recibe un mapa de accessors (uno por columna).

   Uso:
     const { sortKey, direction, toggle, sortBy } =
       useTableSort<GuestWithCompanions>("created_at", "desc");
     const sorted = sortBy(rows, {
       name: (r) => r.guest.name,
       companions: (r) => r.companions.length,
       created_at: (r) => new Date(r.guest.created_at),
     });

   Nulls/undefined se mandan al final sin importar la
   dirección (mantiene el orden natural de lectura).
   ============================================ */

export type SortDirection = "asc" | "desc";
export type SortValue = string | number | Date | null | undefined;

export function useTableSort<T>(
  initialKey?: string | null,
  initialDirection: SortDirection = "asc"
) {
  const [sortKey, setSortKey] = useState<string | null>(initialKey ?? null);
  const [direction, setDirection] = useState<SortDirection>(initialDirection);

  /** Alterna la columna; si es la misma, invierte la dirección. */
  const toggle = useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setDirection("asc");
        return key;
      }
      setDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
      return prevKey;
    });
  }, []);

  /** Ordena una copia de `items` usando el accessor de la columna activa. */
  const sortBy = useCallback(
    (items: T[], accessors: Record<string, (item: T) => SortValue>): T[] => {
      if (!sortKey || !accessors[sortKey]) return items;
      const accessor = accessors[sortKey];
      const sorted = [...items].sort((a, b) => {
        const av = accessor(a);
        const bv = accessor(b);
        // nulls/undefined al final (sin importar dirección).
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        const an = av instanceof Date ? av.getTime() : av;
        const bn = bv instanceof Date ? bv.getTime() : bv;
        if (an < bn) return direction === "asc" ? -1 : 1;
        if (an > bn) return direction === "asc" ? 1 : -1;
        return 0;
      });
      return sorted;
    },
    [sortKey, direction]
  );

  return { sortKey, direction, toggle, sortBy };
}
