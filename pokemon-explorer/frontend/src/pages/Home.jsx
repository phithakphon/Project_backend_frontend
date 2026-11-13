
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import HeroBanner from "../components/HeroBanner";
import Footer from "../components/Footer";

import PokemonGrid from "../components/PokemonGrid";
import PokemonSearch from "../components/PokemonSearch";
import TypeFilter from "../components/TypeFilter";

import "../App.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080";

function Home() {
  const navigate = useNavigate();

  const [pokemon, setPokemon] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favoriteError, setFavoriteError] = useState("");
  const [busyFavorite, setBusyFavorite] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // โหลด Pokémon
  useEffect(() => {
    fetch(`${API_URL}/api/pokemon`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูล Pokémon ได้");
        }

        return response.json();
      })
      .then((data) => {
        setPokemon(data.pokemon || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // โหลด Favorites เมื่อ Login แล้ว
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setFavorites([]);
      return;
    }

    fetch(`${API_URL}/api/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลด Favorites ได้");
        }

        return response.json();
      })
      .then((data) => {
        setFavorites(data.favorites || []);
      })
      .catch((err) => {
        setFavoriteError(err.message);
      });
  }, []);

  // เพิ่มหรือลบ Favorites
  const handleFavorite = async (selectedPokemon) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const isFavorite = favorites.some(
      (item) => item.id === selectedPokemon.id
    );

    setBusyFavorite(selectedPokemon.id);
    setFavoriteError("");

    try {
      if (isFavorite) {
        const response = await fetch(
          `${API_URL}/api/favorites/${selectedPokemon.id}`,
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
          prev.filter((item) => item.id !== selectedPokemon.id)
        );
      } else {
        const response = await fetch(
          `${API_URL}/api/favorites/add`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              pokemon_id: selectedPokemon.id,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("ไม่สามารถเพิ่ม Favorite ได้");
        }

        setFavorites((prev) => [
          ...prev,
          selectedPokemon,
        ]);
      }
    } catch (err) {
      setFavoriteError(err.message);
    } finally {
      setBusyFavorite(null);
    }
  };

  const favoriteIds = favorites.map((item) => item.id);

  const types = [
    "All",
    ...new Set(pokemon.flatMap((p) => p.types || [])),
  ];

  const filteredPokemon = pokemon.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesType =
      selectedType === "All" ||
      (p.types || []).includes(selectedType);

    return matchesSearch && matchesType;
  });

  return (
    <div className="app">
      <Navbar />

      <main>
        <HeroBanner />

        <section className="collection" id="pokemon">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE COLLECTION</span>
              <h2>Explore Pokémon</h2>
              <p>Find your favorite Pokémon from the Pokédex.</p>
            </div>

            <div className="pokemon-count">
              <strong>{pokemon.length}</strong>
              <span>Pokémon</span>
            </div>
          </div>

          <div className="toolbar">
            <PokemonSearch
              search={search}
              onSearchChange={setSearch}
            />

            <TypeFilter
              types={types}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
            />
          </div>

          {favoriteError && (
            <div className="status-message error">
              {favoriteError}
            </div>
          )}

          {loading && (
            <div className="status-message">
              Loading Pokémon...
            </div>
          )}

          {error && (
            <div className="status-message error">
              {error}
              <p>ตรวจสอบว่า Go Backend กำลังทำงานอยู่หรือไม่</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <PokemonGrid
                pokemon={filteredPokemon}
                onFavorite={handleFavorite}
                favoriteIds={favoriteIds}
                busyFavorite={busyFavorite}
              />

              {filteredPokemon.length === 0 && (
                <div className="status-message">
                  ไม่พบ Pokémon ที่ค้นหา
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

export default Home;
