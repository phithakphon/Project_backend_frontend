package store

import (
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound  = errors.New("not found")
	ErrDuplicate = errors.New("duplicate")
	ErrNoPokemon = errors.New("pokemon not found")
)

type Store struct {
	Pool *pgxpool.Pool
}
