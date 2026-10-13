import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// index.html доторх %SITE_URL%-ийг сайтын бүтэн хаягаар солино (OG meta tag-д
// абсолют URL хэрэгтэй). Vercel build үед VERCEL_PROJECT_PRODUCTION_URL-ийг
// автоматаар өгдөг: custom домэйн нэмэгдвэл тэр нь, үгүй бол *.vercel.app.
// Тиймээс домэйн солиход код засах шаардлагагүй. Локал build-д fallback.
// Vercel дээр SITE_URL env (жишээ нь "special-day.mn") тавьбал тэр нь түрүүлнэ —
// project-ийн үндсэн домэйн (одоо 12v-invitation.vercel.app) тараадаг линкээс
// зөрөх үед гараар засах боломж.
function siteUrl() {
  const host =
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'wedding-silk-nine.vercel.app'
  return {
    name: 'site-url',
    transformIndexHtml(html: string) {
      return html.replace(/%SITE_URL%/g, `https://${host}`)
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    siteUrl(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
