package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"pokemon-explorer-backend/mw"
	"pokemon-explorer-backend/store"
)

func (h *Handler) ListFavorites(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	who := mw.WhoFrom(r.Context())

	favorites, err := h.Store.ListFavorites(r.Context(), who.ID)
	if err != nil {
		http.Error(w, "ไม่สามารถดึง Favorite ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"favorites": favorites,
		"total":     len(favorites),
	})
}

type favoriteReq struct {
	PokemonID int `json:"pokemon_id"`
}

func (h *Handler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req favoriteReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "ข้อมูล JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if req.PokemonID <= 0 {
		http.Error(w, "Pokemon ID ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	who := mw.WhoFrom(r.Context())

	err := h.Store.AddFavorite(r.Context(), who.ID, req.PokemonID)

	switch {
	case errors.Is(err, store.ErrDuplicate):
		http.Error(w, "Pokémon นี้อยู่ใน Favorite แล้ว", http.StatusConflict)
		return
	case errors.Is(err, store.ErrNoPokemon):
		http.Error(w, "ไม่พบ Pokémon นี้", http.StatusNotFound)
		return
	case err != nil:
		http.Error(w, "ไม่สามารถเพิ่ม Favorite ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"message":    "เพิ่ม Favorite สำเร็จ",
		"pokemon_id": req.PokemonID,
	})
}

func (h *Handler) DeleteFavorite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idText := strings.TrimPrefix(r.URL.Path, "/api/favorites/")
	pokemonID, err := strconv.Atoi(idText)
	if err != nil || pokemonID <= 0 {
		http.Error(w, "Pokemon ID ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	who := mw.WhoFrom(r.Context())

	err = h.Store.DeleteFavorite(r.Context(), who.ID, pokemonID)
	if errors.Is(err, store.ErrNotFound) {
		http.Error(w, "ไม่พบ Favorite นี้", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "ไม่สามารถลบ Favorite ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"message":    "ลบ Favorite สำเร็จ",
		"pokemon_id": pokemonID,
	})
}
