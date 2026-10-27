import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Toasts from "./components/Toasts";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Rides from "./pages/Rides";
import RideDetails from "./pages/RideDetails";
import RideForm from "./pages/RideForm";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Driver from "./pages/Driver";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-accent focus:p-3 focus:font-bold focus:text-accent-foreground">Skip to content</a>
      <Navbar />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-10 pt-5 md:pb-12 md:pt-8 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rides" element={<Rides />} />
          <Route path="/rides/new" element={<RideForm />} />
          <Route path="/rides/:id" element={<RideDetails />} />
          <Route path="/rides/:id/edit" element={<RideForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/register" element={<Auth initialMode="register" />} />
          <Route path="/drivers/:id" element={<Driver />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toasts />
    </>
  );
}
