package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

var db *pgxpool.Pool

type Pokemon struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	APIName     string   `json:"api_name"`
	ImageURL    string   `json:"image_url"`
	Height      int      `json:"height"`
	Weight      int      `json:"weight"`
	Description string   `json:"description"`
	Types       []string `json:"types"`
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("ไม่พบไฟล์ .env")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("ไม่พบ DATABASE_URL")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	db, err = pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatal("สร้างการเชื่อมต่อฐานข้อมูลไม่สำเร็จ:", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatal("เชื่อมต่อ Supabase ไม่สำเร็จ:", err)
	}

	log.Println("เชื่อมต่อ Supabase PostgreSQL สำเร็จ!")

	http.HandleFunc("/api/health", healthHandler)
	http.HandleFunc("/api/pokemon", getPokemonHandler)

	log.Printf("Backend กำลังทำงานที่ http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":   "ok",
		"database": "connected",
	})
}

func getPokemonHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	query := `
		SELECT
			p.id,
			p.name,
			p.api_name,
			p.image_url,
			COALESCE(p.height, 0),
			COALESCE(p.weight, 0),
			COALESCE(p.description, ''),
			COALESCE(t.name, '')
		FROM pokemon p
		LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
		LEFT JOIN types t ON pt.type_id = t.id
		ORDER BY p.id, t.name;
	`

	rows, err := db.Query(ctx, query)
	if err != nil {
		http.Error(w, "ไม่สามารถดึงข้อมูล Pokémon ได้", http.StatusInternalServerError)
		log.Println("Query error:", err)
		return
	}
	defer rows.Close()

	pokemonList := make([]Pokemon, 0)
	pokemonIndex := make(map[int]int)

	for rows.Next() {
		var p Pokemon
		var typeName string

		err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.APIName,
			&p.ImageURL,
			&p.Height,
			&p.Weight,
			&p.Description,
			&typeName,
		)

		if err != nil {
			http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
			log.Println("Scan error:", err)
			return
		}

		index, exists := pokemonIndex[p.ID]

		if !exists {
			p.Types = make([]string, 0)
			pokemonIndex[p.ID] = len(pokemonList)
			pokemonList = append(pokemonList, p)
			index = pokemonIndex[p.ID]
		}

		if typeName != "" {
			pokemonList[index].Types = append(
				pokemonList[index].Types,
				typeName,
			)
		}
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "เกิดข้อผิดพลาดในการอ่านข้อมูล", http.StatusInternalServerError)
		log.Println("Rows error:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if err := json.NewEncoder(w).Encode(pokemonList); err != nil {
		log.Println("JSON encode error:", err)
	}

	fmt.Printf("ส่งข้อมูล Pokémon จำนวน %d ตัว\n", len(pokemonList))
}
