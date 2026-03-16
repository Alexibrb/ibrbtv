import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToEmbedUrl(videoUrl: string): string {
  if (!videoUrl) return '';

  try {
    const url = new URL(videoUrl);

    // YouTube
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      if (videoUrl.includes('/embed/')) {
        url.searchParams.delete('autoplay'); 
        return url.toString();
      }
      let videoId: string | null = null;
      if (url.hostname === 'youtu.be') {
        videoId = url.pathname.substring(1);
      } else {
        videoId = url.searchParams.get('v');
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;
    }

    // Facebook
    if (url.hostname.includes('facebook.com')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=0&width=560`;
    }

    // Instagram
    if (url.hostname.includes('instagram.com')) {
      // Reels or Posts
      const pathParts = url.pathname.split('/').filter(Boolean);
      const isReel = pathParts.includes('reel');
      const isPost = pathParts.includes('p');
      
      if (isReel || isPost) {
        const id = pathParts[pathParts.indexOf(isReel ? 'reel' : 'p') + 1];
        return `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${id}/embed`;
      }
      return videoUrl;
    }

  } catch (e) {
    console.error('Invalid URL for conversion', e);
  }
  
  return videoUrl;
}
