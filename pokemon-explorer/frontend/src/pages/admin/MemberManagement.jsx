
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Search,
  Shield,
  Trash2,
  RefreshCw,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

function MemberManagement() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("token");

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/admin/members`, {
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

      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดรายชื่อสมาชิกได้");
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleChange = async (member) => {
    const newRole = member.role === "admin" ? "member" : "admin";

    const confirmed = window.confirm(
      `ต้องการเปลี่ยนสิทธิ์ ${member.display_name} เป็น ${newRole.toUpperCase()} ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(member.id);

      const response = await fetch(
        `${API_URL}/api/admin/members/${member.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "เปลี่ยนสิทธิ์ไม่สำเร็จ");
      }

      const data = await response.json();

      setMembers((prev) =>
        prev.map((item) =>
          item.id === member.id ? data.member : item
        )
      );

      alert("เปลี่ยนสิทธิ์สมาชิกสำเร็จ");
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (member) => {
    const confirmed = window.confirm(
      `ต้องการลบบัญชี ${member.display_name} (${member.email}) ใช่หรือไม่?\nการลบนี้ไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) return;

    try {
      setDeletingId(member.id);

      const response = await fetch(
        `${API_URL}/api/admin/members/${member.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "ลบบัญชีไม่สำเร็จ");
      }

      setMembers((prev) =>
        prev.filter((item) => item.id !== member.id)
      );

      alert("ลบบัญชีสมาชิกสำเร็จ");
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMembers = members.filter((member) => {
    const keyword = search.toLowerCase();

    return (
      member.display_name?.toLowerCase().includes(keyword) ||
      member.email?.toLowerCase().includes(keyword) ||
      member.role?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="member-management-page">
      <header className="member-management-header">
        <button
          className="member-back-button"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>

        <div className="member-heading">
          <div className="member-heading-icon">
            <Users size={30} />
          </div>

          <div>
            <h1>Member Management</h1>
            <p>ดูรายชื่อและจัดการบัญชีสมาชิกภายในระบบ</p>
          </div>
        </div>
      </header>

      <section className="member-summary">
        <div>
          <Users size={26} />
          <div>
            <p>Total Members</p>
            <h2>{members.length.toLocaleString()}</h2>
          </div>
        </div>

        <div>
          <Shield size={26} />
          <div>
            <p>Administrators</p>
            <h2>
              {members.filter((member) => member.role === "admin").length}
            </h2>
          </div>
        </div>
      </section>

      <section className="member-table-section">
        <div className="member-table-heading">
          <div>
            <h2>All Members</h2>
            <p>รายชื่อบัญชีสมาชิกทั้งหมดในระบบ</p>
          </div>

          <button
            className="member-refresh-button"
            onClick={loadMembers}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="member-search">
          <Search size={19} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ อีเมล หรือ Role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="member-message">กำลังโหลดรายชื่อสมาชิก...</div>
        ) : error ? (
          <div className="member-error">{error}</div>
        ) : filteredMembers.length === 0 ? (
          <div className="member-message">ไม่พบข้อมูลสมาชิก</div>
        ) : (
          <div className="member-table-wrapper">
            <table className="member-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ชื่อสมาชิก</th>
                  <th>อีเมล</th>
                  <th>Role</th>
                  <th>วันที่สมัคร</th>
                  <th>จัดการบัญชี</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>#{member.id}</td>
                    <td className="member-name">
                      {member.display_name}
                    </td>
                    <td>{member.email}</td>
                    <td>
                      <span
                        className={`member-role ${
                          member.role === "admin" ? "admin" : "member"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td>
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString(
                            "th-TH",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td>
                      <div className="member-actions">
                        <button
                          className="member-role-button"
                          onClick={() => handleRoleChange(member)}
                          disabled={
                            updatingId === member.id ||
                            deletingId === member.id ||
                            member.email?.toLowerCase() ===
                              JSON.parse(
                                localStorage.getItem("member") || "{}"
                              ).email?.toLowerCase()
                          }
                          title={
                            member.email?.toLowerCase() ===
                            JSON.parse(
                              localStorage.getItem("member") || "{}"
                            ).email?.toLowerCase()
                              ? "ไม่สามารถเปลี่ยนสิทธิ์บัญชีตัวเองได้"
                              : "เปลี่ยนสิทธิ์สมาชิก"
                          }
                        >
                          <Shield size={15} />
                          {updatingId === member.id
                            ? "กำลังบันทึก..."
                            : "เปลี่ยน Role"}
                        </button>

                        <button
                          className="member-delete-button"
                          onClick={() => handleDelete(member)}
                          disabled={
                            deletingId === member.id ||
                            updatingId === member.id ||
                            member.email?.toLowerCase() ===
                              JSON.parse(
                                localStorage.getItem("member") || "{}"
                              ).email?.toLowerCase()
                          }
                          title={
                            member.email?.toLowerCase() ===
                            JSON.parse(
                              localStorage.getItem("member") || "{}"
                            ).email?.toLowerCase()
                              ? "ไม่สามารถลบบัญชีตัวเองได้"
                              : "ลบบัญชีสมาชิก"
                          }
                        >
                          <Trash2 size={15} />
                          {deletingId === member.id
                            ? "กำลังลบ..."
                            : "ลบบัญชี"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default MemberManagement;
