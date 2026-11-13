//แบนเนอร์หน้าแรกที่มีข้อความแนะนำและรูป Pikachu
import { ArrowUpRight } from "lucide-react";

function HeroBanner() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="eyebrow">
          YOUR POKÉMON JOURNEY STARTS HERE
        </span>

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
  );
}

export default HeroBanner;
