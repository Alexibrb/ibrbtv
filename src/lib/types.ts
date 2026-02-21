export type Video = {
  id: string;
  youtubeUrl: string;
  title: string;
  summary: string;
  isLive?: boolean;
  category: string;
  finalCategory?: string;
  scheduledAt?: string;
  createdAt: string;
};
