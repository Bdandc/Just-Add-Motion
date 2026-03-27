import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreatePage from './pages/CreatePage';
import AccountPage from './pages/AccountPage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="bottom-right" theme="dark" closeButton />
      </div>
    </Router>
  );
}
