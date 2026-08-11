/* ============================================
   FOTOS DE CÓDIGO DE VESTIMENTA — Manifest tipado
   --------------------------------------------
   Referencias visuales para los invitados. Los
   archivos viven en `public/images/dresscode/`.
   El componente DressCodeSection las renderiza
   en un masonry grid de 8 fotos (sin lightbox —
   son referencia, no galería).

   CÓMO AÑADIR O CAMBIAR FOTOS
   1. Coloca el archivo en `public/images/dresscode/`.
   2. Edita este manifest agregando la ruta
      "/images/dresscode/...".
   3. No requiere tocar nada más.
   ============================================ */

export const dressCodePhotos: readonly string[] = [
  "/images/dresscode/dresscode-01.jpeg",
  "/images/dresscode/dresscode-02.jpeg",
  "/images/dresscode/dresscode-03.jpeg",
  "/images/dresscode/dresscode-04.jpeg",
  "/images/dresscode/dresscode-05.jpeg",
  "/images/dresscode/dresscode-06.jpeg",
  "/images/dresscode/dresscode-07.jpeg",
  "/images/dresscode/dresscode-08.jpeg",
] as const;
