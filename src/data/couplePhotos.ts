/* ============================================
   FOTOS DE LA PAREJA — Manifest tipado
   --------------------------------------------
   Fuente única de verdad para las fotos de Alma
   y Chava. Los archivos viven en `public/images/couple/`
   y este manifest los referencia por ruta.

   CÓMO AÑADIR O CAMBIAR FOTOS
   1. Coloca el archivo en `public/images/couple/`.
   2. Edita este manifest apuntando el campo
      correspondiente a la ruta "/images/couple/...".
   3. No requiere tocar nada más: los componentes
      consumen este manifest y renderizan cuando
      el campo deja de ser `null`.

   RECOMENDACIONES DE IMAGEN
   - Nítidas, buena iluminación.
   - Hero: vertical o cuadrada, ~1600px min.
   - Story: min 600px de ancho, relación libre.
   - Gallery: cualquier relación; el layout es masonry.
   ============================================ */

export const couplePhotos = {
  /** Foto principal del hero. `null` = sin foto, el HeroSection
      usa su composición de texto-only (nombres, fecha, ornamento). */
  hero: "/images/couple/couple-08.jpg" as string | null,

  /** Una foto opcional por hito de la línea de tiempo.
      Cuando un entry es `null`, la StorySection omite la imagen
      y muestra solo el card de año/título/descripción.
      El orden coincide con `ourStory` en `src/data/wedding.ts`. */
  story: [
    null, // 2020 — Nos Conocimos
    null, // 2021 — Primera Cita
    null, // 2022 — Nos Mudamos Juntos
    null, // 2024 — La Propuesta
    null, // 2026 — ¡Boda de plata!
  ] as Array<string | null>,

  /** Galería de fotos de la pareja — todas las fotos
      entregadas que no son hero ni story. El componente
      PhotoGallery las muestra en un masonry responsive. */
  gallery: [
    "/images/couple/couple-01.jpg",
    "/images/couple/couple-02.jpg",
    "/images/couple/couple-03.jpg",
    "/images/couple/couple-04.jpg",
    "/images/couple/couple-05.jpg",
    "/images/couple/couple-06.jpg",
    "/images/couple/couple-07.jpg",
    "/images/couple/couple-08.jpg",
    "/images/couple/couple-09.jpg",
  ] as string[],
} as const;
