import Skeleton, { SkeletonText } from "@/components/shared/Skeleton";

/* ============================================
   PAGE SKELETON — Estructura completa de la página
   Se muestra durante la carga inicial de JavaScript.
   Espejea el layout real para que el usuario vea
   algo coherente mientras los módulos cargan.
   ============================================ */
export default function PageSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-hidden w-full bg-romantic">
      {/* Hero skeleton */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          {/* "¡Boda de plata!" script text */}
          <Skeleton className="h-10 w-48 mx-auto rounded-full" />

          {/* Name 1 */}
          <Skeleton className="h-16 md:h-24 w-64 md:w-80 mx-auto" />

          {/* "&" script */}
          <Skeleton className="h-12 w-16 mx-auto rounded-full" />

          {/* Name 2 */}
          <Skeleton className="h-16 md:h-24 w-64 md:w-80 mx-auto" />

          {/* Date + ornament */}
          <div className="pt-8 space-y-3">
            <Skeleton className="h-4 w-32 mx-auto rounded-full" />
            <Skeleton className="h-5 w-48 mx-auto rounded" />
          </div>

          {/* Scroll indicator */}
          <Skeleton className="h-10 w-6 mx-auto mt-16 rounded-full" />
        </div>
      </section>

      {/* Countdown skeleton */}
      <section className="py-16 md:py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <SkeletonText lines={2} />
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-20 h-20 md:w-28 md:h-32 rounded-xl" />
                <Skeleton className="w-12 h-3 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generic section skeletons (Details, Story, Dress Code, Location) */}
      {Array.from({ length: 4 }).map((_, i) => (
        <section key={i} className="py-16 md:py-32 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <SkeletonText lines={2} />
            <Skeleton className="h-40 md:h-64 w-full rounded-xl" />
            <SkeletonText lines={3} />
          </div>
        </section>
      ))}

      {/* RSVP skeleton */}
      <section className="py-16 md:py-32 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <SkeletonText lines={2} />
          <div className="space-y-4 p-6 rounded-xl bg-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* Playlist skeleton */}
      <section className="py-16 md:py-32 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <SkeletonText lines={2} />
          <Skeleton className="h-12 w-full rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-20 w-full rounded-xl"
            />
          ))}
        </div>
      </section>

      {/* Footer skeleton */}
      <footer className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <Skeleton className="h-8 w-40 mx-auto rounded-full" />
          <Skeleton className="h-4 w-64 mx-auto rounded" />
        </div>
      </footer>
    </div>
  );
}
