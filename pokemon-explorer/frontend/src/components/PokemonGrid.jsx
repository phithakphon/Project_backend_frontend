
import PokemonCard from "./PokemonCard";

function PokemonGrid({
  pokemon,
  onFavorite,
  favoriteIds = [],
  busyFavorite,
}) {
  return (
    <div className="pokemon-grid">
      {pokemon.map((p) => (
        <PokemonCard
          key={p.id}
          pokemon={p}
          onFavorite={onFavorite}
          isFavorite={favoriteIds.includes(p.id)}
          isBusy={busyFavorite === p.id}
        />
      ))}
    </div>
  );
}

export default PokemonGrid;
