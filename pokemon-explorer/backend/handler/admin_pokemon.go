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

// CreatePokemon เพิ่ม Pokémon ใหม่ (Admin)
func (h *Handler) CreatePokemon(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var pokemon store.Pokemon

	if err := json.NewDecoder(r.Body).Decode(&pokemon); err != nil {
		http.Error(w, "รูปแบบข้อมูลไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if pokemon.ID <= 0 ||
		pokemon.Name == "" ||
		pokemon.APIName == "" {
		http.Error(w, "กรุณากรอก ID, Name และ API Name", http.StatusBadRequest)
		return
	}

	if pokemon.Stats.HP < 0 ||
		pokemon.Stats.Attack < 0 ||
		pokemon.Stats.Defense < 0 ||
		pokemon.Stats.SpecialAttack < 0 ||
		pokemon.Stats.SpecialDefense < 0 ||
		pokemon.Stats.Speed < 0 {
		http.Error(w, "ค่าสถานะ Pokémon ต้องไม่ติดลบ", http.StatusBadRequest)
		return
	}

	err := h.Store.CreatePokemon(r.Context(), pokemon)

	if errors.Is(err, store.ErrDuplicate) {
		http.Error(w, "มี Pokémon นี้อยู่แล้ว", http.StatusConflict)
		return
	}

	if err != nil {
		log.Printf("เพิ่ม Pokémon ไม่สำเร็จ: %v", err)
		http.Error(w, "ไม่สามารถเพิ่ม Pokémon ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]any{
		"message": "เพิ่ม Pokémon สำเร็จ",
		"pokemon": pokemon,
	})
}

// UpdatePokemon แก้ไขข้อมูล Pokémon (Admin)
func (h *Handler) UpdatePokemon(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idText := strings.TrimPrefix(r.URL.Path, "/api/admin/pokemon/")
	pokemonID, err := strconv.Atoi(idText)

	if err != nil || pokemonID <= 0 {
		http.Error(w, "รหัส Pokémon ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	var pokemon store.Pokemon

	if err := json.NewDecoder(r.Body).Decode(&pokemon); err != nil {
		http.Error(w, "รูปแบบข้อมูลไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	pokemon.ID = pokemonID

	if pokemon.Name == "" || pokemon.APIName == "" {
		http.Error(w, "กรุณากรอก Name และ API Name", http.StatusBadRequest)
		return
	}

	if pokemon.Stats.HP < 0 ||
		pokemon.Stats.Attack < 0 ||
		pokemon.Stats.Defense < 0 ||
		pokemon.Stats.SpecialAttack < 0 ||
		pokemon.Stats.SpecialDefense < 0 ||
		pokemon.Stats.Speed < 0 {
		http.Error(w, "ค่าสถานะ Pokémon ต้องไม่ติดลบ", http.StatusBadRequest)
		return
	}

	err = h.Store.UpdatePokemon(r.Context(), pokemon)

	if errors.Is(err, store.ErrNotFound) {
		http.Error(w, "ไม่พบ Pokémon นี้", http.StatusNotFound)
		return
	}

	if err != nil {
		log.Printf("แก้ไข Pokémon ไม่สำเร็จ: %v", err)
		http.Error(w, "ไม่สามารถแก้ไข Pokémon ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"message": "แก้ไข Pokémon สำเร็จ",
		"pokemon": pokemon,
	})
}

// DeletePokemon ลบ Pokémon (Admin)
func (h *Handler) DeletePokemon(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idText := strings.TrimPrefix(r.URL.Path, "/api/admin/pokemon/")
	pokemonID, err := strconv.Atoi(idText)

	if err != nil || pokemonID <= 0 {
		http.Error(w, "รหัส Pokémon ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	err = h.Store.DeletePokemon(r.Context(), pokemonID)

	if errors.Is(err, store.ErrNotFound) {
		http.Error(w, "ไม่พบ Pokémon นี้", http.StatusNotFound)
		return
	}

	if err != nil {
		log.Printf("ลบ Pokémon ไม่สำเร็จ: %v", err)
		http.Error(w, "ไม่สามารถลบ Pokémon ได้", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"message": "ลบ Pokémon สำเร็จ",
	})
}
