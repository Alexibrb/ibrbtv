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

const VideoSummaryGenerationInputSchema = z.object({
  youtubeUrl: z.string().url().describe('The URL of the YouTube video to summarize.'),
});
export type VideoSummaryGenerationInput = z.infer<typeof VideoSummaryGenerationInputSchema>;

const VideoSummaryGenerationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the YouTube video content.'),
});
export type VideoSummaryGenerationOutput = z.infer<typeof VideoSummaryGenerationOutputSchema>;

/**
 * MOCK: This function is a placeholder for retrieving a YouTube video transcript.
 * In a real application, this would involve calling a YouTube Data API or a third-party service
 * to extract the transcript from the given YouTube URL.
 * For this example, it returns a hardcoded mock transcript.
 */
async function getYoutubeTranscript(youtubeUrl: string): Promise<string> {
  console.warn(`MOCK: Attempting to fetch transcript for ${youtubeUrl}. This is a placeholder and returns mock data.`);
  // A real implementation would fetch the transcript here.
  return `This is a mock transcript of a YouTube video about the IBRBTV channel and its features.
It explains that IBRBTV provides live YouTube streams and a catalog of past broadcast replays.
Key functionalities include displaying the current live stream prominently on the main screen,
a menu for easy selection of previous videos, and an automated AI-powered summarization tool
for newly added content. The summary generation helps viewers quickly understand a video's topic
before watching the full replay. The channel aims to offer a professional and trustworthy platform
for video content, using a dark blue and light blue color scheme with soft purple accents.
This mock transcript focuses on the app's design philosophy and user experience, ensuring easy navigation
and clear video presentation.`;
}

const videoSummaryPrompt = ai.definePrompt({
  name: 'videoSummaryPrompt',
  input: { schema: z.object({ transcript: z.string().describe('The full transcript of the YouTube video.') }) },
  output: { schema: VideoSummaryGenerationOutputSchema },
  prompt: `You are an expert summarizer. Your task is to generate a concise and informative summary
  of the provided YouTube video transcript. The summary should capture the main points and overall theme
  of the video, suitable for a viewer to quickly understand its content before watching.

  Video Transcript:
  {{{transcript}}}`, 
});

const videoSummaryGenerationFlow = ai.defineFlow(
  {
    name: 'videoSummaryGenerationFlow',
    inputSchema: VideoSummaryGenerationInputSchema,
    outputSchema: VideoSummaryGenerationOutputSchema,
  },
  async (input) => {
    // Step 1: Get the video transcript. In a real app, this would call an external service.
    const transcript = await getYoutubeTranscript(input.youtubeUrl);

    // Step 2: Use the AI model to summarize the transcript.
    const { output } = await videoSummaryPrompt({ transcript });

    if (!output) {
      throw new Error('Failed to generate video summary.');
    }

    return output;
  }
);

export async function summarizeVideo(input: VideoSummaryGenerationInput): Promise<VideoSummaryGenerationOutput> {
  return videoSummaryGenerationFlow(input);
}
