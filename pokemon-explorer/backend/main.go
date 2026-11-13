package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"pokemon-explorer-backend/handler"
	"pokemon-explorer-backend/mw"
	"pokemon-explorer-backend/store"
)

func main() {
	// โหลด Environment Variables
	if err := godotenv.Load(); err != nil {
		log.Println("ไม่พบไฟล์ .env")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	port := os.Getenv("PORT")

	if databaseURL == "" {
		log.Fatal("ไม่พบ DATABASE_URL")
	}

	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET ต้องมีความยาวอย่างน้อย 32 bytes")
	}

	if port == "" {
		port = "8080"
	}

	// เชื่อมต่อ PostgreSQL
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatal("สร้างการเชื่อมต่อฐานข้อมูลไม่สำเร็จ:", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatal("เชื่อมต่อ Supabase ไม่สำเร็จ:", err)
	}

	log.Println("เชื่อมต่อ Supabase PostgreSQL สำเร็จ!")

	// สร้าง Store และ Handler
	dataStore := &store.Store{
		Pool: pool,
	}

	h := handler.New(dataStore, jwtSecret)

	// Middleware
	requireAuth := mw.Auth(jwtSecret)

	// Routes
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":   "ok",
			"database": "connected",
		})
	})

	// Pokémon
	mux.HandleFunc("GET /api/pokemon", h.ListPokemon)
	mux.HandleFunc("GET /api/pokemon/{id}", h.GetPokemonByID)
	mux.HandleFunc("GET /api/pokemon/{id}/reviews", h.ListReviews)

	// Authentication
	mux.HandleFunc("POST /api/register", h.Register)
	mux.HandleFunc("POST /api/login", h.Login)
	mux.Handle("GET /api/me", requireAuth(http.HandlerFunc(h.Me)))

	// Favorites
	mux.Handle("GET /api/favorites", requireAuth(http.HandlerFunc(h.ListFavorites)))
	mux.Handle("POST /api/favorites/add", requireAuth(http.HandlerFunc(h.AddFavorite)))
	mux.Handle("/api/favorites/", requireAuth(http.HandlerFunc(h.DeleteFavorite)))

	// Reviews
	mux.Handle("POST /api/reviews", requireAuth(http.HandlerFunc(h.AddReview)))
	mux.Handle("/api/reviews/", requireAuth(http.HandlerFunc(h.DeleteReview)))
	// Admin
	mux.Handle(
		"GET /api/admin/dashboard",
		requireAuth(mw.AdminOnly(http.HandlerFunc(h.AdminDashboard))),
	)

	// Admin Pokémon Management
	mux.Handle(
		"POST /api/admin/pokemon",
		requireAuth(mw.AdminOnly(http.HandlerFunc(h.CreatePokemon))),
	)

	mux.Handle(
		"PUT /api/admin/pokemon/{id}",
		requireAuth(mw.AdminOnly(http.HandlerFunc(h.UpdatePokemon))),
	)

	mux.Handle(
		"DELETE /api/admin/pokemon/{id}",
		requireAuth(mw.AdminOnly(http.HandlerFunc(h.DeletePokemon))),
	)

	// Admin Member Management
	mux.Handle(
		"GET /api/admin/members",
		requireAuth(mw.AdminOnly(http.HandlerFunc(h.AdminListMembers))),
	)

	mux.Handle(
		"PUT /api/admin/members/{id}",
		requireAuth(mw.AdminOnly(http.HandlerFunc(h.AdminUpdateMemberRole))),
	)

	mux.Handle(
		"DELETE /api/admin/members/{id}",
		requireAuth(mw.AdminOnly(http.HandlerFunc(h.AdminDeleteMember))),
	)
	// Admin Review Management
	mux.Handle(
		"GET /api/admin/reviews",
		requireAuth(mw.AdminOnly(http.HandlerFunc(h.AdminListReviews))),
	)

	// CORS
	server := mw.CORS(mux)

	log.Printf("Backend กำลังทำงานที่ http://localhost:%s\n", port)

	if err := http.ListenAndServe(":"+port, server); err != nil {
		log.Fatal("ไม่สามารถเปิด Backend ได้:", err)
	}
}
