import { liveVideo, pastVideos } from '@/lib/videos';
import VideoDashboard from '@/components/video/VideoDashboard';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <VideoDashboard liveVideo={liveVideo} pastVideos={pastVideos} />
    </div>
  );
}
