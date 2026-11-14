package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

type Member struct {
	ID          int64     `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	Role        string    `json:"role"`
	CreatedAt   time.Time `json:"created_at"`
}

type MemberAuth struct {
	ID           int64
	Email        string
	DisplayName  string
	PasswordHash string
	Role         string
}

func (s *Store) CreateMember(
	ctx context.Context,
	email string,
	passwordHash string,
	displayName string,
) (Member, error) {
	var m Member

	err := s.Pool.QueryRow(ctx, `
		INSERT INTO members (email, password_hash, display_name)
		VALUES ($1, $2, $3)
		RETURNING id, email, display_name, role, created_at
	`, email, passwordHash, displayName).Scan(
		&m.ID,
		&m.Email,
		&m.DisplayName,
		&m.Role,
		&m.CreatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return Member{}, ErrDuplicate
		}

		return Member{}, err
	}

	return m, nil
}

func (s *Store) MemberByEmail(ctx context.Context, email string) (MemberAuth, error) {
	var m MemberAuth

	err := s.Pool.QueryRow(ctx, `
		SELECT id, email, display_name, password_hash, role
		FROM members
		WHERE LOWER(email) = LOWER($1)
	`, email).Scan(
		&m.ID,
		&m.Email,
		&m.DisplayName,
		&m.PasswordHash,
		&m.Role,
	)

	return m, err
}

func (s *Store) MemberByID(ctx context.Context, memberID int64) (Member, error) {
	var m Member

	err := s.Pool.QueryRow(ctx, `
		SELECT id, email, display_name, role, created_at
		FROM members
		WHERE id = $1
	`, memberID).Scan(
		&m.ID,
		&m.Email,
		&m.DisplayName,
		&m.Role,
		&m.CreatedAt,
	)

	return m, err
}
func (s *Store) UpdateMemberPassword(
	ctx context.Context,
	memberID int64,
	passwordHash string,
) error {
	_, err := s.Pool.Exec(ctx, `
		UPDATE members
		SET password_hash = $1,
		    updated_at = NOW()
		WHERE id = $2
	`, passwordHash, memberID)

	return err
}
