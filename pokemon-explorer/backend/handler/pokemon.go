package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"pokemon-explorer-backend/store"
)

func (h *Handler) ListPokemon(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pokemon, err := h.Store.ListPokemon(r.Context())
	if err != nil {
		log.Printf("ดึงข้อมูล Pokémon ไม่สำเร็จ: %v", err)
		http.Error(w, "ไม่สามารถดึงข้อมูล Pokémon ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"pokemon": pokemon,
		"total":   len(pokemon),
	})
}
func (h *Handler) GetPokemonByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idText := strings.TrimPrefix(r.URL.Path, "/api/pokemon/")
	pokemonID, err := strconv.Atoi(idText)

	if err != nil || pokemonID <= 0 {
		http.Error(w, "รหัส Pokémon ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	pokemon, err := h.Store.GetPokemonByID(r.Context(), pokemonID)

	if errors.Is(err, store.ErrNotFound) {
		http.Error(w, "ไม่พบ Pokémon นี้", http.StatusNotFound)
		return
	}

	if err != nil {
		http.Error(w, "ไม่สามารถดึงรายละเอียด Pokémon ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"pokemon": pokemon,
	})
}
