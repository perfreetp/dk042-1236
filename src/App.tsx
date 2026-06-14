import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Favorites from "@/pages/Favorites";
import Profile from "@/pages/Profile";
import MyPrompts from "@/pages/MyPrompts";
import CreatePrompt from "@/pages/CreatePrompt";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Category from "@/pages/Category";
import PromptDetail from "@/pages/PromptDetail";
import Search from "@/pages/Search";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ToastContainer from "@/components/Layout/ToastContainer";
import { useToast } from "@/hooks/useToast";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-cream-100">
      {!isAuthPage && <Header />}
      <main className={`flex-1 ${!isAuthPage ? 'pt-20' : ''}`}>
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function AppRoutes() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-prompts" element={<MyPrompts />} />
        <Route path="/create" element={<CreatePrompt />} />
        <Route path="/edit/:promptId" element={<CreatePrompt />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/category/:category" element={<Category />} />
        <Route path="/categories" element={<Category />} />
        <Route path="/prompt/:promptId" element={<PromptDetail />} />
        <Route path="/search" element={<Search />} />
      </Routes>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <AppRoutes />
      </Layout>
    </Router>
  );
}
