import { Gallery } from '@/gallery/shell';
import { STORIES } from '@/gallery/stories';

export default function Page() {
  return <Gallery stories={STORIES} />;
}
