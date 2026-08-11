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

   NOTA SOBRE EXTENSIONES
   couple-01 a couple-09 son .jpg
   couple-10 a couple-24 son .jpeg
   Verifica el nombre exacto del archivo antes de
   agregarlo al manifest para evitar 404 en runtime.

   RECOMENDACIONES DE IMAGEN
   - Nítidas, buena iluminación.
   - Hero: vertical o cuadrada, ~1600px min.
   - Gallery: cualquier relación; el layout es masonry.
   ============================================ */

export const couplePhotos = {
  /** Foto principal del hero. `null` = sin foto, el HeroSection
      usa su composición de texto-only (nombres, fecha, ornamento). */
  hero: "/images/couple/couple-06.jpg" as string | null,

  /** Galería de fotos de la pareja — todas las fotos
      entregadas que no son hero. El componente PhotoGallery
      las muestra en un masonry responsive. Las fotos de la
      línea de tiempo viven directamente en `ourStory`
      (src/data/wedding.ts) — campo `image` por entry. */
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
    "/images/couple/couple-10.jpeg",
    "/images/couple/couple-11.jpeg",
    "/images/couple/couple-12.jpeg",
    "/images/couple/couple-13.jpeg",
    "/images/couple/couple-14.jpeg",
    "/images/couple/couple-15.jpeg",
    "/images/couple/couple-16.jpeg",
    "/images/couple/couple-17.jpeg",
    "/images/couple/couple-18.jpeg",
    "/images/couple/couple-19.jpeg",
    "/images/couple/couple-20.jpeg",
    "/images/couple/couple-21.jpeg",
    "/images/couple/couple-22.jpeg",
    "/images/couple/couple-23.jpeg",
    "/images/couple/couple-24.jpeg",
  ] as string[],
} as const;
