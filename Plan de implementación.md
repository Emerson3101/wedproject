Plan de implementación completo del sitio web de boda: 8 secciones principales, sistema de diseño glassmorphism con paleta romántica, stack tecnológico completo basado en Next.js y Supabase, esquema de base de datos y 5 fases de desarrollo estimadas en 12 días.
Plan completo de implementación

Sitio web de bodas — Glassmorphism elegante

SECCIONES DEL SITIO (8)

1 · Hero

Portada full-screen — bokeh animado, pétalos flotantes Canvas, nombres en Cormorant Garamond

GSAPCanvas 2D APIFramer MotionCSS Bokeh
2 · Countdown

Contador regresivo — días, horas, minutos, segundos con efecto flip 3D en CSS

React HooksCSS 3D FlipsetIntervalGlass cards
3 · Detalles del Evento

Fecha, hora, ceremonia y recepción — 4 glass cards con íconos Lucide y stagger animation

Framer MotionLucide iconsGSAP stagger
4 · Nuestra Historia

Timeline vertical animado con hitos de la relación, fotos en glass frame, línea dorada central

GSAP ScrollTriggerFramer Motion useInViewParallax
5 · Código de Vestimenta

Paleta visual de colores permitidos, cards para damas y caballeros, guía de estilo cocktail

CSS GridColor swatchesGlass cards
6 · Ubicación / Mapa

Google Maps con estilos ivory/dorado personalizados, marker SVG custom, card glass superpuesta

Google Maps JS APICustom Map StylesPlaces API
7 · RSVP / Invitación

Formulario glass con acompañantes dinámicos, código único por invitado, email automático con Resend

Supabase DBForm validationResend emailsnanoid codes
8 · Playlist Musical

Búsqueda Spotify con debounce, lista de canciones actualizada en tiempo real, sistema de votos

Spotify Web APISupabase RealtimeVote system
SISTEMA DE DISEÑO

Paleta cromática

Ivory — fondo principal
Champagne — bordes
Blush — acentos rosa
Rose — botones
Burgundy — acento primario
Gold — ornamentos
Sage — naturaleza
Tipografía

Display — Cormorant Garamond (Italic 300/400)

Body — Jost (Light 300 / Regular 400)

Script — Great Vibes (ornamentos gold)

Glassmorphism

backdrop-filter: blur(20px) saturate(180%)

background: rgba(255,255,255, 0.18)

border: 1px rgba(255,255,255, 0.35)

border-radius: 24px

STACK TECNOLÓGICO

Next.js 14+App Router · TypeScript · Server Components
SupabasePostgreSQL · Auth · Storage · Realtime subscriptions
Framer Motion + GSAP 3Animaciones de componentes · ScrollTrigger · Parallax
Google Maps APIJavaScript API · estilos ivory/dorado · marker custom SVG
Spotify Web APIClient Credentials Flow · búsqueda de tracks server-side
ResendEmails de confirmación con templates HTML elegantes
VercelDeploy · Edge Functions · CDN global · dominio personalizado
ESQUEMA DE BASE DE DATOS (SUPABASE)

guests
PK
id (uuid)
name · email · phone
invitation_code
status (enum)
num_companions
dietary_restrictions
message · side
confirmed_at · timestamps

companions
PK
id (uuid)
FK
guest_id
name (varchar)
dietary_restrictions
created_at
—
—
—

songs
PK
id (uuid)
title · artist · album
spotify_id (unique)
cover_url · preview_url
added_by (varchar)
votes (int, default 0)
is_approved (bool)
created_at

FASES DE DESARROLLO — ~12 DÍAS ESTIMADOS

Fase 1 — Setup y sistema de diseño

Next.js + Supabase SQL + CSS variables + glassmorphism + tipografía (1.5 días)

Fase 2 — Secciones visuales

Hero, Countdown, Detalles, Historia, Vestimenta con animaciones (3.5 días)

Fase 3 — Features interactivas

Google Maps, RSVP completo con acompañantes, Playlist Spotify + realtime (3.5 días)

Fase 4 — Backend, APIs y admin

API routes completas, RLS Supabase, emails Resend, panel admin (2 días)

Fase 5 — Polish, performance y deploy

GSAP final, responsive, Lighthouse audit, Vercel + dominio personalizado (1.5 días)