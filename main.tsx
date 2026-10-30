import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import Nav from './components/Nav';
import Backdrop from './components/Backdrop';
import Footer from './components/Footer';
import Overview from './pages/Overview';
import Inference from './pages/Inference';
import Benchmarks from './pages/Benchmarks';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-6 text-center">
      <div>
        <div className="font-mono text-[11px] tracking-[0.3em] text-angry">ERR_404 · SIGNAL LOST</div>
        <h1 className="mt-3 font-display text-4xl font-bold text-white">No face detected at this route.</h1>
        <Link to="/" className="mt-6 inline-block font-mono text-sm tracking-widest text-cyan hover:underline">← RETURN TO OVERVIEW</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollTop />
      <Backdrop />
      <div className="relative flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/inference" element={<Inference />} />
            <Route path="/benchmarks" element={<Benchmarks />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
