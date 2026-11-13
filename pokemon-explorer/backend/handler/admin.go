package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"pokemon-explorer-backend/mw"
	"pokemon-explorer-backend/store"
)

// AdminDashboard แสดงข้อมูลภาพรวมสำหรับ Admin
func (h *Handler) AdminDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := mw.WhoFrom(r.Context())

	if user.Role != "admin" {
		http.Error(w, "ไม่มีสิทธิ์เข้าถึงส่วนนี้", http.StatusForbidden)
		return
	}

	stats, err := h.Store.GetAdminStats(r.Context())
	if err != nil {
		http.Error(w, "ไม่สามารถโหลดข้อมูล Dashboard ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "โหลดข้อมูล Admin Dashboard สำเร็จ",
		"stats":   stats,
	})
}

// AdminListMembers แสดงรายชื่อสมาชิกทั้งหมด
func (h *Handler) AdminListMembers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := mw.WhoFrom(r.Context())
	if user.Role != "admin" {
		http.Error(w, "ไม่มีสิทธิ์เข้าถึงส่วนนี้", http.StatusForbidden)
		return
	}

	members, err := h.Store.ListMembers(r.Context())
	if err != nil {
		http.Error(w, "ไม่สามารถโหลดรายชื่อสมาชิกได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "โหลดรายชื่อสมาชิกสำเร็จ",
		"members": members,
	})
}

// AdminUpdateMemberRole เปลี่ยนสิทธิ์สมาชิก
func (h *Handler) AdminUpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := mw.WhoFrom(r.Context())
	if user.Role != "admin" {
		http.Error(w, "ไม่มีสิทธิ์เข้าถึงส่วนนี้", http.StatusForbidden)
		return
	}

	memberID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || memberID <= 0 {
		http.Error(w, "รหัสสมาชิกไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if memberID == user.ID {
		http.Error(w, "ไม่สามารถเปลี่ยนสิทธิ์บัญชีของตัวเองได้", http.StatusForbidden)
		return
	}

	var request struct {
		Role string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "ข้อมูลไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if request.Role != "admin" && request.Role != "member" {
		http.Error(w, "Role ต้องเป็น admin หรือ member เท่านั้น", http.StatusBadRequest)
		return
	}

	member, err := h.Store.UpdateMemberRole(
		r.Context(),
		memberID,
		request.Role,
	)
	if err != nil {
		if err == store.ErrNotFound {
			http.Error(w, "ไม่พบสมาชิก", http.StatusNotFound)
			return
		}

		http.Error(w, "ไม่สามารถเปลี่ยนสิทธิ์สมาชิกได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "เปลี่ยนสิทธิ์สมาชิกสำเร็จ",
		"member":  member,
	})
}

// AdminDeleteMember ลบบัญชีสมาชิก
func (h *Handler) AdminDeleteMember(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	user := mw.WhoFrom(r.Context())
	if user.Role != "admin" {
		http.Error(w, "ไม่มีสิทธิ์เข้าถึงส่วนนี้", http.StatusForbidden)
		return
	}

	memberID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || memberID <= 0 {
		http.Error(w, "รหัสสมาชิกไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if memberID == user.ID {
		http.Error(w, "ไม่สามารถลบบัญชีของตัวเองได้", http.StatusForbidden)
		return
	}

	err = h.Store.DeleteMember(r.Context(), memberID)
	if err != nil {
		if err == store.ErrNotFound {
			http.Error(w, "ไม่พบสมาชิก", http.StatusNotFound)
			return
		}

		http.Error(w, "ไม่สามารถลบบัญชีสมาชิกได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "ลบบัญชีสมาชิกสำเร็จ",
	})
}
