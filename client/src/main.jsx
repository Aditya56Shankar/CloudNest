import { createRoot } from "react-dom/client";
import "./app.css";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./routes/home.jsx";
import DriveDashboard from "./routes/drive-dashboard.jsx";
import { Toaster } from "./components/ui/sonner";
import About from "./routes/about";
import { AuthProvider } from "./components/auth-context";
import Contact from "./routes/contact";
import Trash from "./routes/trash.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DriveDashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/trash" element={<Trash />} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  </AuthProvider>,
);
