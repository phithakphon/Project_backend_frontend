
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Send } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8080";

function PokemonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewContent, setReviewContent] = useState("");
  const [currentMember, setCurrentMember] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [deletingReview, setDeletingReview] = useState(null);

  // โหลดข้อมูล Pokémon
  useEffect(() => {
    const fetchPokemon = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/pokemon/${id}`);

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

  // โหลดรีวิวและตรวจสอบสมาชิก
  useEffect(() => {
    const fetchReviews = async () => {
      setReviewLoading(true);
      setReviewError("");

      try {
        const response = await fetch(
          `${API_URL}/api/pokemon/${id}/reviews`
        );

        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดรีวิวได้");
        }

        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (err) {
        setReviewError(err.message);
      } finally {
        setReviewLoading(false);
      }
    };

    const fetchCurrentMember = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setCurrentMember(null);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setCurrentMember(null);
          return;
        }

        const data = await response.json();
        setCurrentMember(data);
      } catch (err) {
        console.error("ไม่สามารถตรวจสอบสมาชิกได้:", err);
        setCurrentMember(null);
      }
    };

    fetchReviews();
    fetchCurrentMember();
  }, [id]);

  // เพิ่มรีวิว
  const handleAddReview = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (reviewContent.trim().length < 10) {
      setReviewError("รีวิวต้องมีอย่างน้อย 10 ตัวอักษร");
      return;
    }

    setReviewSubmitting(true);
    setReviewError("");

    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pokemon_id: Number(id),
          content: reviewContent.trim(),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
      }

      const data = await response.json();

      setReviews((prev) => [data.review, ...prev]);
      setReviewContent("");
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ลบรีวิว
  const handleDeleteReview = async (reviewID) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!window.confirm("ต้องการลบรีวิวนี้ใช่หรือไม่?")) {
      return;
    }

    setDeletingReview(reviewID);
    setReviewError("");

    try {
      const response = await fetch(
        `${API_URL}/api/reviews/${reviewID}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
      }

      setReviews((prev) =>
        prev.filter((review) => review.id !== reviewID)
      );
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setDeletingReview(null);
    }
  };

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

        {/* Pokémon Detail */}
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

          {/* Base Stats */}
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

        {/* Reviews */}
        <section className="review-section">
          <div className="review-heading">
            <span className="eyebrow">COMMUNITY</span>
            <h2>Pokémon Reviews</h2>
            <p>Share your thoughts about {pokemon.name}.</p>
            <span className="review-count">
              {reviews.length} Reviews
            </span>
          </div>

          {/* Review Form */}
          <div className="review-form-card">
            {currentMember ? (
              <form onSubmit={handleAddReview}>
                <h3>Write a Review</h3>

                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder={`เขียนรีวิวเกี่ยวกับ ${pokemon.name}...`}
                  rows={4}
                  maxLength={1000}
                  disabled={reviewSubmitting}
                />

                <div className="review-form-footer">
                  <span>
                    {reviewContent.length} / 1000 ตัวอักษร
                  </span>

                  <button
                    type="submit"
                    disabled={
                      reviewSubmitting ||
                      reviewContent.trim().length < 10
                    }
                  >
                    <Send size={16} />
                    {reviewSubmitting ? "กำลังส่ง..." : "ส่งรีวิว"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="review-login-prompt">
                <p>เข้าสู่ระบบเพื่อเขียนรีวิว Pokémon ตัวนี้</p>
                <button onClick={() => navigate("/login")}>
                  Login
                </button>
              </div>
            )}
          </div>

          {reviewError && (
            <div className="review-error">
              {reviewError}
            </div>
          )}

          {/* Review List */}
          <div className="review-list">
            {reviewLoading ? (
              <p className="review-empty">กำลังโหลดรีวิว...</p>
            ) : reviews.length === 0 ? (
              <p className="review-empty">
                ยังไม่มีรีวิว Pokémon ตัวนี้ มาเขียนรีวิวเป็นคนแรกกันเลย!
              </p>
            ) : (
              reviews.map((review) => {
                const isOwner =
                  currentMember &&
                  Number(currentMember.member_id) ===
                    Number(review.member_id);

                const isAdmin =
                  currentMember?.role === "admin";

                return (
                  <article className="review-card" key={review.id}>
                    <div className="review-card-header">
                      <div className="review-avatar">
                        {review.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>

                      <div className="review-author">
                        <strong>{review.display_name}</strong>
                        <span>
                          {new Date(review.created_at).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>

                      {(isOwner || isAdmin) && (
                        <button
                          className="review-delete-button"
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReview === review.id}
                          title="ลบรีวิว"
                        >
                          <Trash2 size={17} />
                          {deletingReview === review.id
                            ? "กำลังลบ..."
                            : "ลบ"}
                        </button>
                      )}
                    </div>

                    <p className="review-content">
                      {review.content}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default PokemonDetail;
