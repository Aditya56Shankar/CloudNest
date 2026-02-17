import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./app.css";
import { AuthProvider } from "./components/auth-context";
import { Toaster } from "./components/ui/sonner";
import About from "./routes/about";
import Contact from "./routes/contact";
import DriveDashboard from "./routes/drive-dashboard.jsx";
import Home from "./routes/home.jsx";
import Recent from "./routes/recent.jsx";
import SignUp from "./routes/signup.jsx";
import Starred from "./routes/starred.jsx";
import Trash from "./routes/trash.jsx";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DriveDashboard />} />
        <Route path="/recent" element={<Recent />} />
        <Route path="/starred" element={<Starred />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  </AuthProvider>,
);
