import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToEmbedUrl(youtubeUrl: string): string {
  if (!youtubeUrl) return '';
  if (youtubeUrl.includes('/embed/')) {
    try {
      const url = new URL(youtubeUrl);
      url.searchParams.delete('autoplay'); // remove autoplay before saving
      return url.toString();
    } catch (e) {
      return youtubeUrl;
    }
  }

  try {
    const url = new URL(youtubeUrl);
    let videoId: string | null = null;

    if (url.hostname === 'youtu.be') {
      videoId = url.pathname.substring(1);
    } else if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
      videoId = url.searchParams.get('v');
    }

    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return embedUrl;
    }
  } catch (e) {
    console.error('Invalid URL for YouTube conversion', e);
    return youtubeUrl; // Return original if parsing fails
  }
  
  return youtubeUrl; // Return original if no video id found
}
