package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"pokemon-explorer-backend/mw"
	"pokemon-explorer-backend/store"
)

type reviewReq struct {
	PokemonID int    `json:"pokemon_id"`
	Content   string `json:"content"`
}

func (h *Handler) ListReviews(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/pokemon/")
	parts := strings.Split(path, "/")

	if len(parts) != 2 || parts[1] != "reviews" {
		http.NotFound(w, r)
		return
	}

	pokemonID, err := strconv.Atoi(parts[0])
	if err != nil || pokemonID <= 0 {
		http.Error(w, "รหัส Pokémon ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	reviews, err := h.Store.ListReviews(r.Context(), pokemonID)
	if err != nil {
		http.Error(w, "ไม่สามารถโหลดรีวิวได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"reviews": reviews,
		"total":   len(reviews),
	})
}

func (h *Handler) AddReview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req reviewReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "ข้อมูลไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if req.PokemonID <= 0 {
		http.Error(w, "กรุณาระบุ Pokémon", http.StatusBadRequest)
		return
	}

	req.Content = strings.TrimSpace(req.Content)
	if utf8.RuneCountInString(req.Content) < 10 {
		http.Error(w, "รีวิวต้องมีอย่างน้อย 10 ตัวอักษร", http.StatusBadRequest)
		return
	}

	user := mw.WhoFrom(r.Context())

	review, err := h.Store.AddReview(
		r.Context(),
		user.ID,
		req.PokemonID,
		req.Content,
	)

	if errors.Is(err, store.ErrDuplicate) {
		http.Error(w, "คุณรีวิว Pokémon ตัวนี้ไปแล้ว", http.StatusConflict)
		return
	}

	if errors.Is(err, store.ErrNoPokemon) {
		http.Error(w, "ไม่พบ Pokémon นี้", http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, "ไม่สามารถเพิ่มรีวิวได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]any{
		"message": "เขียนรีวิวสำเร็จ",
		"review":  review,
	})
}

func (h *Handler) DeleteReview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idText := strings.TrimPrefix(r.URL.Path, "/api/reviews/")
	reviewID, err := strconv.ParseInt(idText, 10, 64)

	if err != nil || reviewID <= 0 {
		http.Error(w, "รหัสรีวิวไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	user := mw.WhoFrom(r.Context())

	err = h.Store.DeleteReview(
		r.Context(),
		reviewID,
		user.ID,
		user.Role == "admin",
	)

	if errors.Is(err, store.ErrNotFound) {
		http.Error(w, "ไม่พบรีวิวหรือไม่มีสิทธิ์ลบ", http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, "ไม่สามารถลบรีวิวได้", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AdminListReviews(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	reviews, err := h.Store.ListAllReviews(r.Context())
	if err != nil {
		http.Error(w, "ไม่สามารถโหลดรีวิวทั้งหมดได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"message": "โหลดรีวิวทั้งหมดสำเร็จ",
		"reviews": reviews,
		"total":   len(reviews),
	})
}
