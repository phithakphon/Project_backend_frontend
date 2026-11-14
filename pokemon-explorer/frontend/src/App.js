
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Profile from "./pages/Profile";
import ReviewManagement from "./pages/admin/ReviewManagement";
import AdminRoute from "./components/admin/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PokemonManagement from "./pages/admin/PokemonManagement";
import MemberManagement from "./pages/admin/MemberManagement";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Favorites from "./pages/Favorites";
import PokemonDetail from "./pages/PokemonDetail";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pokemon/:id" element={<PokemonDetail />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />

          <Route
            path="/admin/pokemon"
            element={<PokemonManagement />}
          />

          <Route
            path="/admin/members"
            element={<MemberManagement />}
          />

          <Route
            path="/admin/reviews"
            element={<ReviewManagement />}
          />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
