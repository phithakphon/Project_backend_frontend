
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

function Register() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "สมัครสมาชิกไม่สำเร็จ");
      }

      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      navigate("/login");
    } catch (err) {
      setError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <span>◉</span> POKÉDEX
        </Link>

        <div className="auth-pokemon">
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png"
            alt="Eevee"
          />
        </div>

        <div className="auth-heading">
          <h1>Join the Adventure!</h1>
          <p>สร้างบัญชีเพื่อเริ่มต้นการผจญภัยในโลก Pokémon</p>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-field">
            <label>Display Name</label>
            <input
              type="text"
              placeholder="ชื่อที่ต้องการแสดง"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="ยืนยันรหัสผ่าน"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          มีบัญชีอยู่แล้ว? <Link to="/login">Login</Link>
        </p>

        <Link to="/" className="auth-back">
          ← กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}

export default Register;
