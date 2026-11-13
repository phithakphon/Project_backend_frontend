package store

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

// CreatePokemon เพิ่มข้อมูล Pokémon พร้อมประเภทและค่าสถานะ
func (s *Store) CreatePokemon(ctx context.Context, pokemon Pokemon) error {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// เพิ่มข้อมูล Pokémon
	_, err = tx.Exec(ctx, `
		INSERT INTO pokemon (
			id, name, api_name, image_url,
			height, weight, description
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		pokemon.ID,
		pokemon.Name,
		pokemon.APIName,
		pokemon.ImageURL,
		pokemon.Height,
		pokemon.Weight,
		pokemon.Description,
	)
	if err != nil {
		return err
	}

	// เพิ่มประเภท Pokémon
	for _, typeName := range pokemon.Types {
		var typeID int64

		err = tx.QueryRow(ctx, `
			SELECT id
			FROM types
			WHERE LOWER(name) = LOWER($1)
		`, typeName).Scan(&typeID)

		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("ไม่พบประเภท Pokémon: %s", typeName)
			}
			return err
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO pokemon_types (pokemon_id, type_id)
			VALUES ($1, $2)
		`, pokemon.ID, typeID)

		if err != nil {
			return err
		}
	}

	// เพิ่มค่าสถานะ Pokémon
	_, err = tx.Exec(ctx, `
		INSERT INTO pokemon_stats (
			pokemon_id,
			hp,
			attack,
			defense,
			special_attack,
			special_defense,
			speed
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		pokemon.ID,
		pokemon.Stats.HP,
		pokemon.Stats.Attack,
		pokemon.Stats.Defense,
		pokemon.Stats.SpecialAttack,
		pokemon.Stats.SpecialDefense,
		pokemon.Stats.Speed,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// UpdatePokemon แก้ไขข้อมูล Pokémon พร้อมประเภทและค่าสถานะ
func (s *Store) UpdatePokemon(ctx context.Context, pokemon Pokemon) error {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// แก้ไขข้อมูลพื้นฐาน
	result, err := tx.Exec(ctx, `
		UPDATE pokemon
		SET name = $1,
			api_name = $2,
			image_url = $3,
			height = $4,
			weight = $5,
			description = $6,
			updated_at = NOW()
		WHERE id = $7
	`,
		pokemon.Name,
		pokemon.APIName,
		pokemon.ImageURL,
		pokemon.Height,
		pokemon.Weight,
		pokemon.Description,
		pokemon.ID,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}

	// ลบประเภทเดิม
	_, err = tx.Exec(ctx, `
		DELETE FROM pokemon_types
		WHERE pokemon_id = $1
	`, pokemon.ID)
	if err != nil {
		return err
	}

	// เพิ่มประเภทใหม่
	for _, typeName := range pokemon.Types {
		var typeID int64

		err = tx.QueryRow(ctx, `
			SELECT id
			FROM types
			WHERE LOWER(name) = LOWER($1)
		`, typeName).Scan(&typeID)

		if err != nil {
			if err == pgx.ErrNoRows {
				return fmt.Errorf("ไม่พบประเภท Pokémon: %s", typeName)
			}
			return err
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO pokemon_types (pokemon_id, type_id)
			VALUES ($1, $2)
		`, pokemon.ID, typeID)
		if err != nil {
			return err
		}
	}

	// แก้ไขค่าสถานะ
	result, err = tx.Exec(ctx, `
		UPDATE pokemon_stats
		SET hp = $1,
			attack = $2,
			defense = $3,
			special_attack = $4,
			special_defense = $5,
			speed = $6
		WHERE pokemon_id = $7
	`,
		pokemon.Stats.HP,
		pokemon.Stats.Attack,
		pokemon.Stats.Defense,
		pokemon.Stats.SpecialAttack,
		pokemon.Stats.SpecialDefense,
		pokemon.Stats.Speed,
		pokemon.ID,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("ไม่พบข้อมูล Pokémon Stats")
	}

	return tx.Commit(ctx)
}

// DeletePokemon ลบข้อมูล Pokémon
func (s *Store) DeletePokemon(ctx context.Context, pokemonID int) error {
	result, err := s.Pool.Exec(ctx, `
		DELETE FROM pokemon
		WHERE id = $1
	`, pokemonID)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}
