package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"pokemon-explorer-backend/auth"
	"pokemon-explorer-backend/mw"
	"pokemon-explorer-backend/store"

	"github.com/jackc/pgx/v5"
)

type registerReq struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
type changePasswordReq struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
	ConfirmPassword string `json:"confirm_password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req registerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "ข้อมูล JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := req.Password
	displayName := strings.TrimSpace(req.DisplayName)

	if email == "" || password == "" || displayName == "" {
		http.Error(w, "กรุณากรอกข้อมูลให้ครบ", http.StatusBadRequest)
		return
	}

	if len(password) < 8 {
		http.Error(w, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", http.StatusBadRequest)
		return
	}

	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		http.Error(w, "ไม่สามารถเข้ารหัสรหัสผ่านได้", http.StatusInternalServerError)
		return
	}

	member, err := h.Store.CreateMember(r.Context(), email, passwordHash, displayName)

	if errors.Is(err, store.ErrDuplicate) {
		http.Error(w, "อีเมลนี้ถูกใช้งานแล้ว", http.StatusConflict)
		return
	}
	if err != nil {
		http.Error(w, "ไม่สามารถสมัครสมาชิกได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"message": "สมัครสมาชิกสำเร็จ",
		"member":  member,
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "ข้อมูล JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	member, err := h.Store.MemberByEmail(r.Context(), email)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "อีเมลหรือรหัสผ่านไม่ถูกต้อง", http.StatusUnauthorized)
		return
	}
	if err != nil {
		http.Error(w, "ไม่สามารถเข้าสู่ระบบได้", http.StatusInternalServerError)
		return
	}

	if auth.CheckPassword(req.Password, member.PasswordHash) != nil {
		http.Error(w, "อีเมลหรือรหัสผ่านไม่ถูกต้อง", http.StatusUnauthorized)
		return
	}

	token, err := auth.GenerateToken(
		member.ID,
		member.Email,
		member.Role,
		h.JWTSecret,
	)
	if err != nil {
		http.Error(w, "ไม่สามารถสร้าง Token ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"message": "เข้าสู่ระบบสำเร็จ",
		"token":   token,
		"member": map[string]any{
			"id":           member.ID,
			"email":        member.Email,
			"display_name": member.DisplayName,
			"role":         member.Role,
		},
	})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	who := mw.WhoFrom(r.Context())

	member, err := h.Store.MemberByID(r.Context(), who.ID)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "กรุณาเข้าสู่ระบบก่อน", http.StatusUnauthorized)
		return
	}
	if err != nil {
		http.Error(w, "ไม่สามารถดึงข้อมูลสมาชิกได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"message":   "ยืนยันตัวตนสำเร็จ",
		"member_id": member.ID,
		"email":     member.Email,
		"role":      member.Role,
	})
}
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req changePasswordReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "ข้อมูล JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if req.CurrentPassword == "" || req.NewPassword == "" || req.ConfirmPassword == "" {
		http.Error(w, "กรุณากรอกข้อมูลให้ครบ", http.StatusBadRequest)
		return
	}

	if len(req.NewPassword) < 8 {
		http.Error(w, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร", http.StatusBadRequest)
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		http.Error(w, "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน", http.StatusBadRequest)
		return
	}

	if req.CurrentPassword == req.NewPassword {
		http.Error(w, "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม", http.StatusBadRequest)
		return
	}

	who := mw.WhoFrom(r.Context())

	member, err := h.Store.MemberByEmail(r.Context(), who.Email)
	if errors.Is(err, pgx.ErrNoRows) {
		http.Error(w, "ไม่พบข้อมูลสมาชิก", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "ไม่สามารถตรวจสอบข้อมูลสมาชิกได้", http.StatusInternalServerError)
		return
	}

	if auth.CheckPassword(req.CurrentPassword, member.PasswordHash) != nil {
		http.Error(w, "รหัสผ่านปัจจุบันไม่ถูกต้อง", http.StatusUnauthorized)
		return
	}

	passwordHash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		http.Error(w, "ไม่สามารถเข้ารหัสรหัสผ่านได้", http.StatusInternalServerError)
		return
	}

	if err := h.Store.UpdateMemberPassword(r.Context(), who.ID, passwordHash); err != nil {
		http.Error(w, "ไม่สามารถเปลี่ยนรหัสผ่านได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "เปลี่ยนรหัสผ่านสำเร็จ",
	})
}
