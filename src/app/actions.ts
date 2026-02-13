'use server';

import { z } from 'zod';
import { summarizeVideo, type VideoSummaryGenerationOutput } from '@/ai/flows/video-summary-generation-flow';
import { convertToEmbedUrl } from '@/lib/utils';

const FormSchema = z.object({
  youtubeUrl: z.string().url('Por favor, insira uma URL válida do YouTube.'),
});

export type FormState = {
  title: VideoSummaryGenerationOutput['title'] | null;
  summary: VideoSummaryGenerationOutput['summary'] | null;
  error: string | null;
  youtubeUrl?: string;
};

export async function addVideoAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = FormSchema.safeParse({
    youtubeUrl: formData.get('youtubeUrl'),
  });

  if (!validatedFields.success) {
    return {
      title: null,
      summary: null,
      error: validatedFields.error.flatten().fieldErrors.youtubeUrl?.[0] ?? 'Erro de validação.',
    };
  }

  const originalUrl = validatedFields.data.youtubeUrl;

  try {
    const result = await summarizeVideo({ youtubeUrl: originalUrl });
    console.log('Generated Summary:', result.summary);
    
    const embedUrl = convertToEmbedUrl(originalUrl);
    
    if (!embedUrl || !embedUrl.includes('/embed/')) {
        return {
            title: null,
            summary: null,
            error: 'A URL fornecida não parece ser um vídeo válido do YouTube.',
            youtubeUrl: originalUrl,
        }
    }

    return { title: result.title, summary: result.summary, error: null, youtubeUrl: embedUrl };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return {
      title: null,
      summary: null,
      error: `Falha ao gerar o resumo: ${errorMessage}`,
    };
  }
}
