
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  Mail,
  ShieldCheck,
  ArrowLeft,
  LockKeyhole,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

function Profile() {
  let member = null;

  try {
    member = JSON.parse(localStorage.getItem("member"));
  } catch {
    member = null;
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 8) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }

      setMessage(data.message || "เปลี่ยนรหัสผ่านสำเร็จ");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  if (!member) {
    return (
      <div className="app">
        <Navbar />
        <main className="auth-page">
          <div className="auth-card">
            <h2>ไม่พบข้อมูลสมาชิก</h2>
            <Link to="/login">เข้าสู่ระบบ</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />

      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-heading">
            <h1>My Profile</h1>
            <p>ข้อมูลบัญชีสมาชิกของคุณ</p>
          </div>

          <div className="profile-info">
            <p>
              <UserRound size={18} />
              <strong>ชื่อสมาชิก</strong>
              <span>{member.display_name || "-"}</span>
            </p>

            <p>
              <Mail size={18} />
              <strong>Email</strong>
              <span>{member.email || "-"}</span>
            </p>

            <p>
              <ShieldCheck size={18} />
              <strong>Role</strong>
              <span>{member.role || "member"}</span>
            </p>
          </div>

          <div className="profile-password">
            <h2>
              <LockKeyhole size={20} />
              เปลี่ยนรหัสผ่าน
            </h2>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>รหัสผ่านปัจจุบัน</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="form-group">
                <label>รหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="form-group">
                <label>ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && <p className="form-error">{error}</p>}
              {message && <p className="form-success">{message}</p>}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "กำลังเปลี่ยนรหัสผ่าน..." : "บันทึกรหัสผ่านใหม่"}
              </button>
            </form>
          </div>

          <Link to="/" className="auth-back">
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Profile;
