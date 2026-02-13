'use server';

import { z } from 'zod';
import { summarizeVideo, type VideoSummaryGenerationOutput } from '@/ai/flows/video-summary-generation-flow';

const FormSchema = z.object({
  youtubeUrl: z.string().url('Por favor, insira uma URL válida do YouTube.'),
});

export type FormState = {
  summary: VideoSummaryGenerationOutput['summary'] | null;
  error: string | null;
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
      summary: null,
      error: validatedFields.error.flatten().fieldErrors.youtubeUrl?.[0] ?? 'Erro de validação.',
    };
  }

  try {
    const result = await summarizeVideo({ youtubeUrl: validatedFields.data.youtubeUrl });
    // In a real application, you would save the video URL and summary to a database here.
    // For this demo, we just return the summary to display it on the client.
    console.log('Generated Summary:', result.summary);
    
    return { summary: result.summary, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return {
      summary: null,
      error: `Falha ao gerar o resumo: ${errorMessage}`,
    };
  }
}
