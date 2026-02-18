import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'I.B.R.B TV',
    short_name: 'I.B.R.B TV',
    description: 'Evangelizando para Cristo através de transmissões ao vivo e replays.',
    start_url: '/',
    display: 'standalone',
    background_color: '#EBEBFA',
    theme_color: '#3B82F6',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
}
