import { AnnouncerProvider } from './context/AnnouncerContext';
import { UnpackProvider } from './context/UnpackContext';
import SkipLink from './components/SkipLink';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CustomPackaging from './components/CustomPackaging';
import Footer from './components/Footer';

export default function App() {
  return (
    <AnnouncerProvider>
      <UnpackProvider>
        <SkipLink />
        <Navbar />
        <main id="main">
          <Hero />
          <CustomPackaging />
        </main>
        <Footer />
      </UnpackProvider>
    </AnnouncerProvider>
  );
}
