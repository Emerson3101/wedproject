import { couple } from "@/data/wedding";

/* ============================================
   FOOTER
   ============================================ */
export default function Footer() {
  return (
    <footer className="relative z-20 text-center py-12 px-4">
      {/* Ornamento */}
      <div className="ornament-line max-w-xs mx-auto mb-8">
        <span className="text-script text-gold text-2xl">❦</span>
      </div>

      {/* Nombres */}
      <p className="text-script text-gold text-3xl md:text-4xl mb-4">
        {couple.name1} & {couple.name2}
      </p>

      {/* Mensaje */}
      <p className="text-body text-burgundy/50 text-sm max-w-md mx-auto mb-6">
        "Y tuvieron muchos, y muy buenos, hijos."
        <br />
        <span className="italic">— Caperucita Roja</span>
      </p>

      {/* Hashtag */}
      <p className="text-body text-gold text-sm uppercase tracking-widest mb-8">
        #{couple.name1.replace(/\s/g, "")}{couple.name2.replace(/\s/g, "")}SeCasan
      </p>

      {/* Copyright */}
      <p className="text-body text-burgundy/30 text-xs">
        Hecho con ❤️ para nuestro gran día
      </p>
    </footer>
  );
}
