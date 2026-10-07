import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MultiplayerArena } from '@/features/arena/components/MultiplayerArena';

const ArenaPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow container-custom pt-24 pb-12">
        <MultiplayerArena />
      </main>

      <Footer />
    </div>
  );
};

export default ArenaPage;
