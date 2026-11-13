
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function PokemonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/pokemon/${id}`
        );

        if (!response.ok) {
          throw new Error("ไม่พบข้อมูล Pokémon");
        }

        const data = await response.json();
        setPokemon(data.pokemon);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [id]);

  if (loading) {
    return <p className="detail-message">Loading Pokémon...</p>;
  }

  if (error || !pokemon) {
    return (
      <p className="detail-message">
        {error || "ไม่พบ Pokémon"}
      </p>
    );
  }

  return (
    <>
      <Navbar />

      <main className="pokemon-detail-page">
        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
          Back to Pokédex
        </button>

        <section className="detail-card">
          <div className="detail-image">
            <img src={pokemon.image_url} alt={pokemon.name} />
          </div>

          <div className="detail-info">
            <span className="detail-number">
              #{String(pokemon.id).padStart(3, "0")}
            </span>

            <h1>{pokemon.name}</h1>

            <div className="pokemon-types">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className={`type-tag type-${type.toLowerCase()}`}
                >
                  {type}
                </span>
              ))}
            </div>

            <p className="detail-description">
              {pokemon.description || "ยังไม่มีคำอธิบาย Pokémon ตัวนี้"}
            </p>

            <div className="detail-measurements">
              <div>
                <span>Height</span>
                <strong>
                  {pokemon.height ? `${pokemon.height} m` : "-"}
                </strong>
              </div>

              <div>
                <span>Weight</span>
                <strong>
                  {pokemon.weight ? `${pokemon.weight} kg` : "-"}
                </strong>
              </div>
            </div>
          </div>

          <div className="detail-stats">
            <h2>Base Stats</h2>

            <div className="stats-grid">
              {[
                { label: "HP", value: pokemon.stats.hp },
                { label: "Attack", value: pokemon.stats.attack },
                { label: "Defense", value: pokemon.stats.defense },
                { label: "Sp. Attack", value: pokemon.stats.special_attack },
                { label: "Sp. Defense", value: pokemon.stats.special_defense },
                { label: "Speed", value: pokemon.stats.speed },
              ].map((stat) => (
                <div className="stat-row" key={stat.label}>
                  <div className="stat-label">
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>

                  <div className="stat-track">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${Math.min(
                          (stat.value / 255) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default PokemonDetail;
