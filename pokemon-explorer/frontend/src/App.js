
import { useEffect, useState } from "react";
import { Search, Heart, Menu, ArrowUpRight } from "lucide-react";
import "./App.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080";

function App() {
  const [pokemon, setPokemon] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/pokemon`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูล Pokémon ได้");
        }
        return response.json();
      })
      .then((data) => {
        setPokemon(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

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
      <header className="navbar">
        <a href="/" className="brand">
          <span className="brand-icon">◉</span>
          <span>POKÉ<span className="brand-highlight">DEX</span></span>
        </a>

        <nav className="nav-links">
          <a href="/" className="active">Home</a>
          <a href="#pokemon">Pokémon</a>
          <a href="#favorites">Favorites</a>
        </nav>

        <div className="nav-actions">
          <button className="login-button">Login</button>
          <button className="register-button">Sign Up</button>
          <button className="mobile-menu" aria-label="Open menu">
            <Menu size={23} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">YOUR POKÉMON JOURNEY STARTS HERE</span>
            <h1>
              Discover Your
              <br />
              <span>Favorite Pokémon.</span>
            </h1>
            <p>
              Explore the world of Pokémon. Discover their abilities,
              types, and everything that makes them unique.
            </p>
            <a href="#pokemon" className="explore-button">
              Explore Pokémon <ArrowUpRight size={18} />
            </a>
          </div>

          <div className="hero-art">
            <img
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
              alt="Pikachu"
            />
            <div className="hero-circle"></div>
            <span className="hero-label">#025 PIKACHU</span>
          </div>
        </section>

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
            <div className="search-box">
              <Search size={19} />
              <input
                type="text"
                placeholder="Search Pokémon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="type-filters">
              {types.map((type) => (
                <button
                  key={type}
                  className={selectedType === type ? "type-filter selected" : "type-filter"}
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="status-message">Loading Pokémon...</div>
          )}

          {error && (
            <div className="status-message error">
              {error}
              <p>ตรวจสอบว่า Go Backend กำลังทำงานอยู่หรือไม่</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="pokemon-grid">
                {filteredPokemon.map((p) => (
                  <article className="pokemon-card" key={p.id}>
                    <div className="card-top">
                      <span className="pokemon-number">
                        #{String(p.id).padStart(3, "0")}
                      </span>
                      <button
                        className="favorite-button"
                        aria-label={`Favorite ${p.name}`}
                      >
                        <Heart size={19} />
                      </button>
                    </div>

                    <div className="pokemon-image">
                      <img
                        src={
                          p.image_url ||
                          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
                        }
                        alt={p.name}
                        loading="lazy"
                      />
                    </div>

                    <div className="pokemon-info">
                      <h3>{p.name}</h3>
                      <div className="pokemon-types">
                        {(p.types || []).map((type) => (
                          <span
                            key={type}
                            className={`type-tag type-${type.toLowerCase()}`}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {filteredPokemon.length === 0 && (
                <div className="status-message">
                  ไม่พบ Pokémon ที่ค้นหา
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <span>POKÉDEX</span>
        <p>Explore the world of Pokémon.</p>
      </footer>
    </div>
  );
}

export default App;
