
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PokemonCard({ pokemon, onFavorite, isFavorite, isBusy }) {
  const navigate = useNavigate();

  return (
    <article className="pokemon-card">
      <div className="card-top">
        <span className="pokemon-number">
          #{String(pokemon.id).padStart(3, "0")}
        </span>

        <button
          className={`favorite-button ${isFavorite ? "active" : ""}`}
          aria-label={
            isFavorite
              ? `Remove ${pokemon.name} from favorites`
              : `Add ${pokemon.name} to favorites`
          }
          onClick={() => onFavorite?.(pokemon)}
          disabled={isBusy}
        >
          <Heart
            size={19}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div
        className="pokemon-image"
        onClick={() => navigate(`/pokemon/${pokemon.id}`)}
        style={{ cursor: "pointer" }}
      >
        <img
          src={
            pokemon.image_url ||
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
          }
          alt={pokemon.name}
          loading="lazy"
        />
      </div>

      <div className="pokemon-info">
        <h3>{pokemon.name}</h3>

        <div className="pokemon-types">
          {(pokemon.types || []).map((type) => (
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
  );
}

export default PokemonCard;
