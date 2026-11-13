package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

type Review struct {
	ID          int64     `json:"id"`
	MemberID    int64     `json:"member_id"`
	DisplayName string    `json:"display_name"`
	PokemonID   int       `json:"pokemon_id"`
	PokemonName string    `json:"pokemon_name"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (s *Store) ListReviews(ctx context.Context, pokemonID int) ([]Review, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT
			r.id,
			r.member_id,
			m.display_name,
			r.pokemon_id,
			r.content,
			r.created_at,
			r.updated_at
		FROM reviews r
		JOIN members m ON m.id = r.member_id
		WHERE r.pokemon_id = $1
		ORDER BY r.created_at DESC
	`, pokemonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := []Review{}

	for rows.Next() {
		var review Review

		if err := rows.Scan(
			&review.ID,
			&review.MemberID,
			&review.DisplayName,
			&review.PokemonID,
			&review.Content,
			&review.CreatedAt,
			&review.UpdatedAt,
		); err != nil {
			return nil, err
		}

		reviews = append(reviews, review)
	}

	return reviews, rows.Err()
}

func (s *Store) AddReview(
	ctx context.Context,
	memberID int64,
	pokemonID int,
	content string,
) (Review, error) {
	var review Review

	err := s.Pool.QueryRow(ctx, `
		INSERT INTO reviews (member_id, pokemon_id, content)
		VALUES ($1, $2, $3)
		RETURNING
			id,
			member_id,
			(SELECT display_name FROM members WHERE id = $1),
			pokemon_id,
			content,
			created_at,
			updated_at
	`, memberID, pokemonID, content).Scan(
		&review.ID,
		&review.MemberID,
		&review.DisplayName,
		&review.PokemonID,
		&review.Content,
		&review.CreatedAt,
		&review.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23505":
				return Review{}, ErrDuplicate
			case "23503":
				return Review{}, ErrNoPokemon
			}
		}

		return Review{}, err
	}

	return review, nil
}

func (s *Store) DeleteReview(
	ctx context.Context,
	reviewID int64,
	memberID int64,
	isAdmin bool,
) error {
	tag, err := s.Pool.Exec(ctx, `
		DELETE FROM reviews
		WHERE id = $1 AND (member_id = $2 OR $3)
	`, reviewID, memberID, isAdmin)

	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

// ListAllReviews ดึงรีวิวทั้งหมดสำหรับ Admin
func (s *Store) ListAllReviews(ctx context.Context) ([]Review, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT
			r.id,
			r.member_id,
			m.display_name,
			r.pokemon_id,
			p.name,
			r.content,
			r.created_at,
			r.updated_at
		FROM reviews r
		JOIN members m ON m.id = r.member_id
		JOIN pokemon p ON p.id = r.pokemon_id
		ORDER BY r.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := make([]Review, 0)

	for rows.Next() {
		var review Review

		if err := rows.Scan(
			&review.ID,
			&review.MemberID,
			&review.DisplayName,
			&review.PokemonID,
			&review.PokemonName,
			&review.Content,
			&review.CreatedAt,
			&review.UpdatedAt,
		); err != nil {
			return nil, err
		}

		reviews = append(reviews, review)
	}

	return reviews, rows.Err()
}
