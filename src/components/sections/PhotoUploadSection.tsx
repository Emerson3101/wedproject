"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Upload,
  ImagePlus,
  CheckCircle,
  ExternalLink,
  X,
  Loader2,
  QrCode,
} from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import GlassCard from "@/components/ui/GlassCard";
import { cloudinaryConfig, googlePhotosConfig } from "@/lib/config";

/* ============================================
   TYPE PARA EL WIDGET DE CLOUDINARY
   ============================================ */
interface CloudinaryWindow extends Window {
  cloudinary: {
    createUploadWidget: (
      options: Record<string, any>,
      callback: (error: any, result: any) => void
    ) => {
      open: () => void;
      destroy: () => void;
    };
  };
}

/* ============================================
   SECCIÓN DE FOTOS — Subir Fotos del Evento
   ============================================ */
export default function PhotoUploadSection() {
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { publicId: string; url: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [widget, setWidget] = useState<any>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  // Cargar el script de Cloudinary y crear el widget
  useEffect(() => {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      console.warn(
        "[Cloudinary] Not configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
      );
      return;
    }

    const cloudinaryWindow = window as unknown as CloudinaryWindow;

    // Si ya está cargado, inicializar directamente
    if (cloudinaryWindow.cloudinary) {
      initWidget(cloudinaryWindow);
      return;
    }

    // Cargar script dinámicamente
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => {
      if (cloudinaryWindow.cloudinary) {
        initWidget(cloudinaryWindow);
      } else {
        console.error("[Cloudinary] Script loaded but window.cloudinary not found");
      }
    };
    script.onerror = () => {
      console.error("[Cloudinary] Failed to load upload widget script");
      setWidgetError("No se pudo cargar el widget de subida");
    };
    document.head.appendChild(script);

    return () => {
      widget?.destroy();
    };
  }, []);

  const initWidget = useCallback((cw: CloudinaryWindow) => {
    if (!cw.cloudinary || !cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      console.warn("[Cloudinary] Cannot init widget — config missing");
      return;
    }

    try {
      const uploadWidget = cw.cloudinary.createUploadWidget(
        {
          cloudName: cloudinaryConfig.cloudName,
          uploadPreset: cloudinaryConfig.uploadPreset,
          sources: ["local", "camera"],
          multiple: true,
          maxFiles: 10,
          folder: "wedding-guest-photos",
          clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
          maxImageFileSize: 10000000, // 10MB
          cropping: false,
          showAdvancedOptions: false,
          styles: {
            palette: {
              window: "#FFFFF0",
              windowBorder: "#F7E7CE",
              tabIcon: "#C5A55A",
              otherIcons: "#722F37",
              windowBackground: "#FFFFF0",
              tabIconSelected: "#722F37",
              textColor: "#722F37",
              textAccent: "#C5A55A",
              actionButton: "#722F37",
              actionButtonMenu: "#722F37",
              actionButtonActive: "#8C3A42",
              actionButtonDisabled: "#F7E7CE",
              cancelButton: "#F7E7CE",
              cancelButtonHover: "#DCAE96",
            },
          },
        },
        (error: any, result: any) => {
          setIsUploading(false);

          if (error) {
            console.error("[Cloudinary] Upload error:", error);
            return;
          }

          if (result.event === "success") {
            const info = result.info;
            setUploadedPhotos((prev) => [
              ...prev,
              {
                publicId: info.public_id,
                url: info.secure_url,
              },
            ]);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 4000);
          } else if (result.event === "close") {
            console.log("[Cloudinary] Widget closed");
          }
        }
      );

      setWidget(uploadWidget);
      console.log("[Cloudinary] Widget initialized successfully");
    } catch (err) {
      console.error("[Cloudinary] Failed to create upload widget:", err);
      setWidgetError("Error al inicializar el widget: verifica tu configuración de Cloudinary");
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (widget) {
      setIsUploading(true);
      widget.open();
    }
  }, [widget]);

  return (
    <section id="photos" className="section-padding relative z-20">
      <div className="max-w-4xl mx-auto">
        <SectionTitle
          ornament="❦"
          title="Fotos del Evento"
          subtitle="Comparte tus fotos de nuestro gran día para crear un recuerdo eterno"
        />

        {/* Tarjetas de opciones */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Opción 1: Subir fotos directamente */}
          <GlassCard variant="strong" className="text-center flex flex-col items-center justify-center min-h-[280px]">
            <div className="mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-burgundy to-burgundy-light flex items-center justify-center mx-auto shadow-lg"
              >
                <ImagePlus size={36} className="text-ivory" />
              </motion.div>
            </div>

            <h3 className="text-display text-2xl text-burgundy mb-3">
              Sube tus Fotos
            </h3>
            <p className="text-body text-burgundy/60 mb-6 max-w-xs mx-auto">
              Sube directamente las fotos que tomaste en el evento. ¡Hasta 10 fotos a la vez!
            </p>

            <motion.button
              onClick={handleUpload}
              disabled={!widget || isUploading}
              whileHover={!!widget && !isUploading ? { scale: 1.03 } : {}}
              whileTap={!!widget && !isUploading ? { scale: 0.97 } : {}}
              className={`btn-outline inline-flex items-center gap-2 ${
                !widget || isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Abriendo...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Seleccionar Fotos
                </>
              )}
            </motion.button>

            {!cloudinaryConfig.cloudName && (
              <p className="text-xs text-rose mt-3">
                Cloudinary no está configurado
              </p>
            )}
          </GlassCard>

          {/* Opción 2: Google Photos */}
          <GlassCard variant="strong" className="text-center flex flex-col items-center justify-center min-h-[280px]">
            <div className="mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto shadow-lg"
              >
                <ExternalLink size={36} className="text-ivory" />
              </motion.div>
            </div>

            <h3 className="text-display text-2xl text-burgundy mb-3">
              Google Photos
            </h3>
            <p className="text-body text-burgundy/60 mb-6 max-w-xs mx-auto">
              Ve a nuestro álbum compartido para ver y agregar todas las fotos del evento.
            </p>

            {googlePhotosConfig.albumUrl ? (
              <motion.a
                href={googlePhotosConfig.albumUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-outline inline-flex items-center gap-2"
              >
                <ExternalLink size={18} />
                Ver Álbum
              </motion.a>
            ) : (
              <p className="text-xs text-burgundy/40">
                Enlace al álbum próximamente
              </p>
            )}
          </GlassCard>

          {/* Opción 3: Código QR */}
          <GlassCard variant="strong" className="text-center flex flex-col items-center justify-center min-h-[280px] md:col-span-2">
            <div className="mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-sage to-sage/80 flex items-center justify-center mx-auto shadow-lg"
              >
                <QrCode size={36} className="text-ivory" />
              </motion.div>
            </div>

            <h3 className="text-display text-2xl text-burgundy mb-3">
              Escanea para Compartir
            </h3>
            <p className="text-body text-burgundy/60 mb-6 max-w-xs mx-auto">
              Escanea este código para abrir nuestro álbum de fotos directamente en tu teléfono.
            </p>

            <div className="inline-flex flex-col items-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="p-4 bg-white rounded-2xl shadow-lg border-2 border-champagne"
              >
                <QRCodeSVG
                  value={googlePhotosConfig.albumUrl || "https://photos.app.goo.gl/QAvUYFHzY6XZTfAC9"}
                  size={180}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#722F37"
                />
              </motion.div>

              <motion.a
                href={googlePhotosConfig.albumUrl || "https://photos.app.goo.gl/QAvUYFHzY6XZTfAC9"}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-outline inline-flex items-center gap-2 text-sm"
              >
                <ExternalLink size={16} />
                Abrir álbum en nueva pestaña
              </motion.a>
            </div>
          </GlassCard>
        </motion.div>

        {/* Mensaje de éxito */}
        <motion.div
          initial={false}
          animate={uploadSuccess ? { opacity: 1, y: 0 } : { opacity: 0, y: -10, pointerEvents: "none" }}
          className="text-center mt-6"
        >
          <div className="inline-flex items-center gap-2 text-sage bg-sage/10 px-6 py-3 rounded-full">
            <CheckCircle size={20} />
            <span className="text-body text-sm">¡Fotos subidas exitosamente!</span>
          </div>
        </motion.div>

        {/* Galería de fotos subidas en esta sesión */}
        {uploadedPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <h4 className="text-display text-xl text-burgundy/70 text-center mb-4">
              Recién subidas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {uploadedPhotos.map((photo, index) => (
                <motion.div
                  key={photo.publicId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-square rounded-xl overflow-hidden border-2 border-champagne shadow-md"
                >
                  <img
                    src={photo.url}
                    alt={`Foto subida ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
