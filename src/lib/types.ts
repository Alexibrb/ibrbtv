export type Video = {
  id: string;
  youtubeUrl: string;
  title: string;
  summary: string;
  isLive?: boolean;
  category: string;
  scheduledAt?: string;
  createdAt: string;
};
