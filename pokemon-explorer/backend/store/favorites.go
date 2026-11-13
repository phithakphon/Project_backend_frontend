package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

type FavoritePokemon struct {
	ID       int      `json:"id"`
	Name     string   `json:"name"`
	APIName  string   `json:"api_name"`
	ImageURL string   `json:"image_url"`
	Types    []string `json:"types"`
}

func (s *Store) ListFavorites(ctx context.Context, memberID int64) ([]FavoritePokemon, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT
			p.id,
			p.name,
			p.api_name,
			p.image_url,
			t.name
		FROM favorites f
		JOIN pokemon p ON p.id = f.pokemon_id
		LEFT JOIN pokemon_types pt ON pt.pokemon_id = p.id
		LEFT JOIN types t ON t.id = pt.type_id
		WHERE f.member_id = $1
		ORDER BY p.id
	`, memberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	indexByID := make(map[int]int)
	var favorites []FavoritePokemon

	for rows.Next() {
		var pokemonID int
		var typeName *string
		p := FavoritePokemon{}

		if err := rows.Scan(
			&pokemonID,
			&p.Name,
			&p.APIName,
			&p.ImageURL,
			&typeName,
		); err != nil {
			return nil, err
		}

		index, ok := indexByID[pokemonID]
		if !ok {
			p.ID = pokemonID
			p.Types = []string{}

			favorites = append(favorites, p)
			index = len(favorites) - 1
			indexByID[pokemonID] = index
		}

		if typeName != nil {
			favorites[index].Types = append(
				favorites[index].Types,
				*typeName,
			)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return favorites, nil
}

func (s *Store) AddFavorite(ctx context.Context, memberID int64, pokemonID int) error {
	_, err := s.Pool.Exec(ctx, `
		INSERT INTO favorites (member_id, pokemon_id)
		VALUES ($1, $2)
	`, memberID, pokemonID)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23505":
				return ErrDuplicate
			case "23503":
				return ErrNoPokemon
			}
		}

		return err
	}

	return nil
}

func (s *Store) DeleteFavorite(ctx context.Context, memberID int64, pokemonID int) error {
	tag, err := s.Pool.Exec(ctx, `
		DELETE FROM favorites
		WHERE member_id = $1 AND pokemon_id = $2
	`, memberID, pokemonID)
	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}
