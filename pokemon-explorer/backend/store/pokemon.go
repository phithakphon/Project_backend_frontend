package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type Pokemon struct {
	ID          int          `json:"id"`
	Name        string       `json:"name"`
	APIName     string       `json:"api_name"`
	ImageURL    string       `json:"image_url"`
	Height      float64      `json:"height"`
	Weight      float64      `json:"weight"`
	Description string       `json:"description"`
	Types       []string     `json:"types"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
	Stats       PokemonStats `json:"stats"`
}
type PokemonStats struct {
	HP             int `json:"hp"`
	Attack         int `json:"attack"`
	Defense        int `json:"defense"`
	SpecialAttack  int `json:"special_attack"`
	SpecialDefense int `json:"special_defense"`
	Speed          int `json:"speed"`
}

func (s *Store) ListPokemon(ctx context.Context) ([]Pokemon, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT
    p.id,
    p.name,
    p.api_name,
    COALESCE(p.image_url, ''),
    COALESCE(p.height, 0),
    COALESCE(p.weight, 0),
    COALESCE(p.description, ''),
    t.name
		FROM pokemon p
		LEFT JOIN pokemon_types pt ON pt.pokemon_id = p.id
		LEFT JOIN types t ON t.id = pt.type_id
		ORDER BY p.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	indexByID := make(map[int]int)
	var pokemonList []Pokemon

	for rows.Next() {
		var pokemonID int
		var typeName *string
		p := Pokemon{}

		if err := rows.Scan(
			&pokemonID,
			&p.Name,
			&p.APIName,
			&p.ImageURL,
			&p.Height,
			&p.Weight,
			&p.Description,
			&typeName,
		); err != nil {
			return nil, err
		}

		index, ok := indexByID[pokemonID]
		if !ok {
			p.ID = pokemonID
			p.Types = []string{}

			pokemonList = append(pokemonList, p)
			index = len(pokemonList) - 1
			indexByID[pokemonID] = index
		}

		if typeName != nil {
			pokemonList[index].Types = append(
				pokemonList[index].Types,
				*typeName,
			)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return pokemonList, nil
}

func (s *Store) GetPokemonByID(
	ctx context.Context,
	pokemonID int,
) (Pokemon, error) {
	var pokemon Pokemon

	pokemon.Types = []string{}

	err := s.Pool.QueryRow(ctx, `
		SELECT
			p.id,
			p.name,
			p.api_name,
			COALESCE(p.image_url, ''),
			COALESCE(p.height, 0),
			COALESCE(p.weight, 0),
			COALESCE(p.description, '')
		FROM pokemon p
		WHERE p.id = $1
	`, pokemonID).Scan(
		&pokemon.ID,
		&pokemon.Name,
		&pokemon.APIName,
		&pokemon.ImageURL,
		&pokemon.Height,
		&pokemon.Weight,
		&pokemon.Description,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return Pokemon{}, ErrNotFound
	}

	if err != nil {
		return Pokemon{}, err
	}

	// ดึงประเภท Pokémon
	rows, err := s.Pool.Query(ctx, `
		SELECT t.name
		FROM pokemon_types pt
		JOIN types t ON t.id = pt.type_id
		WHERE pt.pokemon_id = $1
		ORDER BY t.id
	`, pokemonID)

	if err != nil {
		return Pokemon{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var typeName string

		if err := rows.Scan(&typeName); err != nil {
			return Pokemon{}, err
		}

		pokemon.Types = append(pokemon.Types, typeName)
	}

	if err := rows.Err(); err != nil {
		return Pokemon{}, err
	}

	// ดึงค่าสถานะ Pokémon
	err = s.Pool.QueryRow(ctx, `
		SELECT
			hp,
			attack,
			defense,
			special_attack,
			special_defense,
			speed
		FROM pokemon_stats
		WHERE pokemon_id = $1
	`, pokemonID).Scan(
		&pokemon.Stats.HP,
		&pokemon.Stats.Attack,
		&pokemon.Stats.Defense,
		&pokemon.Stats.SpecialAttack,
		&pokemon.Stats.SpecialDefense,
		&pokemon.Stats.Speed,
	)

	if err != nil {
		return Pokemon{}, err
	}

	return pokemon, nil
}
