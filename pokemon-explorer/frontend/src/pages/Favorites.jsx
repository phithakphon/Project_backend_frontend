
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PokemonGrid from "../components/PokemonGrid";

import "../App.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyFavorite, setBusyFavorite] = useState(null);

  // โหลดรายการ Favorites
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/api/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดรายการ Favorites ได้");
        }

        return response.json();
      })
      .then((data) => {
        setFavorites(data.favorites || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ลบ Pokémon ออกจาก Favorites
  const handleRemoveFavorite = async (pokemon) => {
    const token = localStorage.getItem("token");

    setBusyFavorite(pokemon.id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/favorites/${pokemon.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("ไม่สามารถลบ Favorite ได้");
      }

      setFavorites((prev) =>
        prev.filter((item) => item.id !== pokemon.id)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyFavorite(null);
    }
  };

  const favoriteIds = favorites.map((item) => item.id);

  return (
    <div className="app">
      <Navbar />

      <main>
        <section className="collection" id="favorites">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR COLLECTION</span>
              <h2>My Favorites</h2>
              <p>Your favorite Pokémon in one place.</p>
            </div>

            <div className="pokemon-count">
              <strong>{favorites.length}</strong>
              <span>Pokémon</span>
            </div>
          </div>

          {loading && (
            <div className="status-message">
              Loading Favorites...
            </div>
          )}

          {error && (
            <div className="status-message error">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {favorites.length > 0 ? (
                <PokemonGrid
                  pokemon={favorites}
                  onFavorite={handleRemoveFavorite}
                  favoriteIds={favoriteIds}
                  busyFavorite={busyFavorite}
                />
              ) : (
                <div className="status-message">
                  ยังไม่มี Pokémon ในรายการโปรด
                  <p>กลับไปหน้า Home แล้วกดหัวใจ Pokémon ที่ชอบได้เลย</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Favorites;
