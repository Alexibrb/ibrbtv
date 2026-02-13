'use server';
/**
 * @fileOverview A Genkit flow for summarizing YouTube videos.
 *
 * - summarizeVideo - A function that handles the video summarization process.
 * - VideoSummaryGenerationInput - The input type for the summarizeVideo function.
 * - VideoSummaryGenerationOutput - The return type for the summarizeVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { YoutubeTranscript } from 'youtube-transcript';

const VideoSummaryGenerationInputSchema = z.object({
  youtubeUrl: z.string().url().describe('The URL of the YouTube video to summarize.'),
});
export type VideoSummaryGenerationInput = z.infer<typeof VideoSummaryGenerationInputSchema>;

const VideoSummaryGenerationOutputSchema = z.object({
  title: z.string().describe('A short, engaging title for the video based on its content.'),
  summary: z.string().describe('A concise summary of the YouTube video content.'),
});
export type VideoSummaryGenerationOutput = z.infer<typeof VideoSummaryGenerationOutputSchema>;

async function getYoutubeTranscript(youtubeUrl: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);
    if (!transcript || transcript.length === 0) {
      throw new Error("Não foi possível obter a transcrição ou o vídeo não tem legendas.");
    }
    return transcript.map(item => item.text).join(' ');
  } catch (error) {
    console.error("Erro ao buscar a transcrição do YouTube:", error);
    if (error instanceof Error && (error.message.includes('subtitles are disabled') || error.message.includes('No transcripts are available'))) {
      throw new Error("As legendas estão desativadas ou indisponíveis para este vídeo. Não é possível gerar um resumo.");
    }
    throw new Error("Falha ao buscar a transcrição do YouTube. Verifique a URL e se o vídeo possui legendas.");
  }
}

const videoSummaryPrompt = ai.definePrompt({
  name: 'videoSummaryPrompt',
  input: { schema: z.object({ transcript: z.string().describe('The full transcript of the YouTube video.') }) },
  output: { schema: VideoSummaryGenerationOutputSchema },
  prompt: `Você é um especialista em resumos. Sua tarefa é gerar um resumo conciso e informativo
  E um título curto e envolvente para a transcrição do vídeo do YouTube fornecida. O resumo deve capturar os pontos principais
  e o tema geral do vídeo, adequado para um espectador entender rapidamente seu conteúdo antes de assistir.

  Transcrição do Vídeo:
  {{{transcript}}}`, 
});

const videoSummaryGenerationFlow = ai.defineFlow(
  {
    name: 'videoSummaryGenerationFlow',
    inputSchema: VideoSummaryGenerationInputSchema,
    outputSchema: VideoSummaryGenerationOutputSchema,
  },
  async (input) => {
    // Step 1: Get the video transcript.
    const transcript = await getYoutubeTranscript(input.youtubeUrl);

    // Step 2: Use the AI model to summarize the transcript.
    const { output } = await videoSummaryPrompt({ transcript });

    if (!output) {
      throw new Error('Falha ao gerar o resumo do vídeo.');
    }

    return output;
  }
);

export async function summarizeVideo(input: VideoSummaryGenerationInput): Promise<VideoSummaryGenerationOutput> {
  return videoSummaryGenerationFlow(input);
}
