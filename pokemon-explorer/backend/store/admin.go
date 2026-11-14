package store

import (
	"context"
)
//ดึงข้อมูลสถิติภาพรวมจากฐานข้อมูล เพื่อนำไปแสดงบนหน้า Admin Dashboard
type AdminStats struct {
	TotalPokemon   int64 `json:"total_pokemon"`
	TotalMembers   int64 `json:"total_members"`
	TotalReviews   int64 `json:"total_reviews"`
	TotalFavorites int64 `json:"total_favorites"`
}

func (s *Store) GetAdminStats(ctx context.Context) (AdminStats, error) {
	var stats AdminStats

	err := s.Pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM pokemon),
			(SELECT COUNT(*) FROM members),
			(SELECT COUNT(*) FROM reviews),
			(SELECT COUNT(*) FROM favorites)
	`).Scan(
		&stats.TotalPokemon,
		&stats.TotalMembers,
		&stats.TotalReviews,
		&stats.TotalFavorites,
	)

	if err != nil {
		return AdminStats{}, err
	}

	return stats, nil
}
