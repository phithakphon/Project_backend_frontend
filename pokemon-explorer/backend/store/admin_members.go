package store

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
)

// ดึงรายชื่อสมาชิกทั้งหมด
func (s *Store) ListMembers(ctx context.Context) ([]Member, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT id, email, display_name, role, created_at
		FROM members
		ORDER BY id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := make([]Member, 0)

	for rows.Next() {
		var m Member

		err := rows.Scan(
			&m.ID,
			&m.Email,
			&m.DisplayName,
			&m.Role,
			&m.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		members = append(members, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return members, nil
}

// เปลี่ยนสิทธิ์สมาชิก
func (s *Store) UpdateMemberRole(
	ctx context.Context,
	memberID int64,
	role string,
) (Member, error) {
	role = strings.ToLower(strings.TrimSpace(role))

	if role != "admin" && role != "member" {
		return Member{}, errors.New("role ไม่ถูกต้อง")
	}

	var m Member

	err := s.Pool.QueryRow(ctx, `
		UPDATE members
		SET role = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, email, display_name, role, created_at
	`, role, memberID).Scan(
		&m.ID,
		&m.Email,
		&m.DisplayName,
		&m.Role,
		&m.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return Member{}, ErrNotFound
	}

	return m, err
}

// ลบบัญชีสมาชิก
func (s *Store) DeleteMember(ctx context.Context, memberID int64) error {
	result, err := s.Pool.Exec(ctx, `
		DELETE FROM members
		WHERE id = $1
	`, memberID)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}
