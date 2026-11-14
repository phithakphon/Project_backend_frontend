package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"pokemon-explorer-backend/mw"
	"pokemon-explorer-backend/store"
)

type updateMemberRoleRequest struct {
	Role string `json:"role"`
}

// GET /api/admin/members ดึงรายชื่อสมาชิกทั้งหมด
func (h *Handler) ListMembers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	members, err := h.Store.ListMembers(r.Context())
	if err != nil {
		http.Error(w, "ไม่สามารถดึงรายชื่อสมาชิกได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"members": members,
	})
}

// PUT /api/admin/members/{id} 	เปลี่ยนสิทธิ์สมาชิกเป็น Admin หรือ Member
func (h *Handler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "รหัสสมาชิกไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	user := mw.WhoFrom(r.Context())

	var req updateMemberRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "ข้อมูลไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	req.Role = strings.ToLower(strings.TrimSpace(req.Role))
	if req.Role != "admin" && req.Role != "member" {
		http.Error(w, "Role ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	// ป้องกันแอดมินลดสิทธิ์บัญชีตัวเอง 
	if id == user.ID && req.Role != "admin" {
		http.Error(w, "ไม่สามารถลดสิทธิ์บัญชีตัวเองได้", http.StatusForbidden)
		return
	}

	member, err := h.Store.UpdateMemberRole(r.Context(), id, req.Role)
	if err != nil {
		if err == store.ErrNotFound {
			http.Error(w, "ไม่พบสมาชิก", http.StatusNotFound)
			return
		}
		http.Error(w, "ไม่สามารถแก้ไขสมาชิกได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "อัปเดตสิทธิ์สมาชิกสำเร็จ",
		"member":  member,
	})
}

// DELETE /api/admin/members/{id} ลบบัญชีสมาชิก
func (h *Handler) DeleteMember(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "รหัสสมาชิกไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	user := mw.WhoFrom(r.Context())

	// ป้องกันแอดมินลบบัญชีตัวเอง
	if id == user.ID {
		http.Error(w, "ไม่สามารถลบบัญชีตัวเองได้", http.StatusForbidden)
		return
	}

	if err := h.Store.DeleteMember(r.Context(), id); err != nil {
		http.Error(w, "ไม่สามารถลบสมาชิกได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "ลบบัญชีสมาชิกสำเร็จ",
	})
}
