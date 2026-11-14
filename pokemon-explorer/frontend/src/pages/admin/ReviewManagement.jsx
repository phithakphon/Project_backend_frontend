
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
//เป็นหน้าแอดมินสำหรับตรวจสอบ ค้นหา และลบรีวิวที่สมาชิกเขียนเกี่ยวกับ Pokémon
function ReviewManagement() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadReviews = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const response = await fetch(`${API_URL}/api/admin/reviews`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("member");
      navigate("/login");
      return;
    }

    if (response.status === 403) {
      setError("บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้านี้");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "ไม่สามารถโหลดรีวิวได้");
    }

    setReviews(data.reviews || []);
  } catch (err) {
    setError(err.message || "เกิดข้อผิดพลาด");
  } finally {
    setLoading(false);
  }
}, [navigate]);

 useEffect(() => {
  loadReviews();
}, [loadReviews]);

  const handleDelete = async (review) => {
    const confirmed = window.confirm(
      `ต้องการลบรีวิวของ ${review.display_name} ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(review.id);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/reviews/${review.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("member");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("ไม่สามารถลบรีวิวได้");
      }

      setReviews((previous) =>
        previous.filter((item) => item.id !== review.id)
      );
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบรีวิว");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const keyword = search.toLowerCase();

    return (
      review.display_name?.toLowerCase().includes(keyword) ||
      review.pokemon_name?.toLowerCase().includes(keyword) ||
      review.content?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="member-management-page">
      <header className="member-management-header">
        <button
          className="member-back-button"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft size={18} />
          กลับ Dashboard
        </button>

        <div className="member-heading">
          <div>
            <h1>Review Management</h1>
            <p>ตรวจสอบและจัดการรีวิวจากสมาชิก</p>
          </div>
        </div>
      </header>

      <section className="member-summary">
        <div>
          <MessageSquare size={25} />
          <div>
            <p>รีวิวทั้งหมด</p>
            <h2>{reviews.length.toLocaleString()}</h2>
          </div>
        </div>
      </section>

      <section className="member-table-section">
        <div className="member-table-toolbar">
          <div className="member-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อสมาชิก Pokémon หรือข้อความรีวิว..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="member-back-button"
            onClick={loadReviews}
            disabled={loading}
          >
            <RefreshCw size={17} />
            รีเฟรช
          </button>
        </div>

        {loading ? (
          <div className="member-message">กำลังโหลดรีวิว...</div>
        ) : error ? (
          <div className="member-error">{error}</div>
        ) : filteredReviews.length === 0 ? (
          <div className="member-message">
            {search ? "ไม่พบรีวิวที่ค้นหา" : "ยังไม่มีรีวิวในระบบ"}
          </div>
        ) : (
          <div className="member-table-wrapper">
            <table className="member-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>สมาชิก</th>
                  <th>Pokémon</th>
                  <th>ข้อความรีวิว</th>
                  <th>วันที่รีวิว</th>
                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id}>
                    <td>#{review.id}</td>
                    <td>{review.display_name}</td>
                    <td>
                      {review.pokemon_name || `#${review.pokemon_id}`}
                    </td>
                    <td className="review-content-cell">
                      {review.content}
                    </td>
                    <td>
                      {new Date(review.created_at).toLocaleDateString("th-TH")}
                    </td>
                    <td>
                      <button
                        className="member-delete-button"
                        onClick={() => handleDelete(review)}
                        disabled={deletingId === review.id}
                      >
                        <Trash2 size={16} />
                        {deletingId === review.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <p className="member-table-footer">
            แสดง {filteredReviews.length} จาก {reviews.length} รีวิว
          </p>
        )}
      </section>
    </div>
  );
}

export default ReviewManagement;
