'use server';

import { z } from 'zod';
import { convertToEmbedUrl } from '@/lib/utils';

const FormSchema = z.object({
  videoUrl: z.string().url('Por favor, insira uma URL válida.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  scheduledAt: z.string().optional(),
  manualTitle: z.string().optional(),
});

export type FormState = {
  title: string | null;
  summary: string | null;
  error: string | null;
  videoUrl?: string;
  category?: string;
  scheduledAt?: string;
  needsManualTitle?: boolean;
};

async function getYoutubeVideoTitle(youtubeUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.title;
  } catch (error) {
    console.error("Erro ao buscar o título do YouTube:", error);
    return null;
  }
}

export async function addVideoAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = FormSchema.safeParse({
    videoUrl: formData.get('videoUrl'),
    category: formData.get('category') ?? '',
    scheduledAt: formData.get('scheduledAt') || undefined,
    manualTitle: formData.get('manualTitle') || undefined,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.flatten().fieldErrors.videoUrl?.[0] 
      || validatedFields.error.flatten().fieldErrors.category?.[0]
      || 'Erro de validação.';

    return { title: null, summary: null, error: firstError };
  }

  const { videoUrl: originalUrl, category, scheduledAt, manualTitle } = validatedFields.data;
  const embedUrl = convertToEmbedUrl(originalUrl);

  try {
    let title = manualTitle || null;

    // Tenta buscar título automático apenas se for YouTube e não tiver título manual
    if (!title && (originalUrl.includes('youtube.com') || originalUrl.includes('youtu.be'))) {
      title = await getYoutubeVideoTitle(originalUrl);
    }

    // Se ainda não temos título, avisamos o cliente que ele precisa fornecer um (para FB/IG ou se o YT falhar)
    if (!title) {
      return {
        title: null,
        summary: null,
        error: 'Não foi possível obter o título automaticamente. Por favor, insira-o manualmente.',
        needsManualTitle: true,
        videoUrl: embedUrl,
        category,
        scheduledAt
      };
    }

    return { 
      title: title, 
      summary: '', 
      error: null, 
      videoUrl: embedUrl, 
      category: category, 
      scheduledAt: scheduledAt 
    };
  } catch (e) {
    console.error(e);
    return {
      title: null,
      summary: null,
      error: 'Ocorreu um erro ao processar o vídeo.',
    };
  }
}
