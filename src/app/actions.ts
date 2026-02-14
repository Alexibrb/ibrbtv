'use server';

import { z } from 'zod';
import { convertToEmbedUrl } from '@/lib/utils';

const FormSchema = z.object({
  youtubeUrl: z.string().url('Por favor, insira uma URL válida do YouTube.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
});

export type FormState = {
  title: string | null;
  summary: string | null; // Manter para consistência, mas será vazio
  error: string | null;
  youtubeUrl?: string;
  category?: string;
};

async function getYoutubeVideoTitle(youtubeUrl: string): Promise<string> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
    if (!response.ok) {
      const errorData = await response.text();
      console.error('YouTube oEmbed error:', errorData);
      throw new Error(`Não foi possível obter o título do vídeo. Status: ${response.status}`);
    }
    const data = await response.json();
    return data.title;
  } catch (error) {
    console.error("Erro ao buscar o título do YouTube:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao buscar o título do YouTube: ${error.message}`);
    }
    throw new Error("Falha ao buscar o título do YouTube. Verifique a URL.");
  }
}


export async function addVideoAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = FormSchema.safeParse({
    youtubeUrl: formData.get('youtubeUrl'),
    category: formData.get('category'),
  });

  if (!validatedFields.success) {
    return {
      title: null,
      summary: null,
      error: validatedFields.error.flatten().fieldErrors.youtubeUrl?.[0] ?? validatedFields.error.flatten().fieldErrors.category?.[0] ?? 'Erro de validação.',
    };
  }

  const { youtubeUrl: originalUrl, category } = validatedFields.data;

  try {
    const title = await getYoutubeVideoTitle(originalUrl);
    const embedUrl = convertToEmbedUrl(originalUrl);
    
    if (!embedUrl || !embedUrl.includes('/embed/')) {
        return {
            title: null,
            summary: null,
            error: 'A URL fornecida não parece ser um vídeo válido do YouTube.',
            youtubeUrl: originalUrl,
        }
    }

    return { title: title, summary: '', error: null, youtubeUrl: embedUrl, category: category };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return {
      title: null,
      summary: null,
      error: `Falha ao processar o vídeo: ${errorMessage}`,
    };
  }
}
