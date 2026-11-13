
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Users,
    Heart,
    MessageSquare,
    Settings,
    LogOut,
    Gamepad2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        total_pokemon: 0,
        total_members: 0,
        total_reviews: 0,
        total_favorites: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await fetch(`${API_URL}/api/admin/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("member");
                    navigate("/login");
                    return;
                }

                if (response.status === 403) {
                    setError("บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้า Admin");
                    return;
                }

                if (!response.ok) {
                    throw new Error(data.message || "ไม่สามารถโหลด Dashboard ได้");
                }

                setStats(data.stats);
            } catch (err) {
                setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("member");
        navigate("/login");
    };

    const cards = [
        {
            title: "Total Pokémon",
            value: stats.total_pokemon,
            icon: <Gamepad2 size={25} />,
            color: "blue",
        },
        {
            title: "Total Members",
            value: stats.total_members,
            icon: <Users size={25} />,
            color: "green",
        },
        {
            title: "Total Reviews",
            value: stats.total_reviews,
            icon: <MessageSquare size={25} />,
            color: "orange",
        },
        {
            title: "Total Favorites",
            value: stats.total_favorites,
            icon: <Heart size={25} />,
            color: "pink",
        },
    ];

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <span>◉</span>
                    <div>
                        <h2>POKÉDEX</h2>
                        <small>ADMIN PANEL</small>
                    </div>
                </div>

                <nav className="admin-menu">
                    <p className="admin-menu-label">MENU</p>

                    <button
                        className="admin-menu-item active"
                        onClick={() => navigate("/admin")}
                    >
                        <LayoutDashboard size={19} />
                        Dashboard
                    </button>

                    <button
                        className="admin-menu-item"
                        onClick={() => navigate("/admin/pokemon")}
                    >
                        <Gamepad2 size={19} />
                        Pokémon
                    </button>

                    <button
                        className="admin-menu-item"
                        onClick={() => navigate("/admin/members")}
                    >
                        <Users size={19} />
                        Members
                    </button>

                    <button
                        className="admin-menu-item"
                        onClick={() => navigate("/admin/reviews")}
                    >
                        <MessageSquare size={19} />
                        Reviews
                    </button>
                </nav>

                <div className="admin-sidebar-bottom">
                    <button className="admin-menu-item">
                        <Settings size={19} />
                        Settings
                    </button>

                    <button className="admin-menu-item logout" onClick={handleLogout}>
                        <LogOut size={19} />
                        Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <h1>Dashboard</h1>
                        <p>Welcome back, Admin!</p>
                    </div>

                    <div className="admin-profile">
                        <div className="admin-avatar">A</div>
                        <div>
                            <strong>
                                {JSON.parse(
                                    localStorage.getItem("member") || "{}"
                                ).display_name || "Admin"}
                            </strong>
                            <small>Administrator</small>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="admin-message">
                        กำลังโหลดข้อมูล Dashboard...
                    </div>
                ) : error ? (
                    <div className="admin-error">{error}</div>
                ) : (
                    <>
                        <section className="admin-welcome">
                            <div>
                                <span>ADMIN OVERVIEW</span>
                                <h2>จัดการ Pokémon Explorer</h2>
                                <p>ภาพรวมข้อมูลและกิจกรรมทั้งหมดภายในเว็บไซต์</p>
                            </div>

                            <div className="admin-welcome-icon">
                                <Gamepad2 size={75} />
                            </div>
                        </section>

                        <section className="admin-stats-grid">
                            {cards.map((card) => (
                                <div className="admin-stat-card" key={card.title}>
                                    <div className={`admin-stat-icon ${card.color}`}>
                                        {card.icon}
                                    </div>

                                    <div>
                                        <p>{card.title}</p>
                                        <h2>{card.value.toLocaleString()}</h2>
                                    </div>
                                </div>
                            ))}
                        </section>

                        <section className="admin-section">
                            <div className="admin-section-heading">
                                <div>
                                    <h2>Quick Management</h2>
                                    <p>จัดการข้อมูลเว็บไซต์ได้จากส่วนนี้</p>
                                </div>
                            </div>

                            <div className="admin-management-grid">
                                <button
                                    type="button"
                                    className="admin-management-card"
                                    onClick={() => navigate("/admin/pokemon")}
                                >
                                    <Gamepad2 size={28} />
                                    <h3>Pokémon Management</h3>
                                    <p>เพิ่ม แก้ไข และลบข้อมูล Pokémon</p>
                                    <span>Manage Pokémon →</span>
                                </button>

                                <button
                                    type="button"
                                    className="admin-management-card"
                                    onClick={() => navigate("/admin/members")}
                                >
                                    <Users size={28} />
                                    <h3>Member Management</h3>
                                    <p>ดูรายชื่อและจัดการบัญชีสมาชิก</p>
                                    <span>Manage Members →</span>
                                </button>
                                <button
                                    type="button"
                                    className="admin-management-card"
                                    onClick={() => navigate("/admin/reviews")}
                                >
                                    <MessageSquare size={28} />
                                    <h3>Review Management</h3>
                                    <p>ตรวจสอบและจัดการรีวิว</p>
                                    <span>Manage Reviews →</span>
                                </button>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
