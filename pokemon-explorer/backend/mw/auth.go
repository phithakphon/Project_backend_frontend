package mw

import (
	"context"
	"net/http"
	"strings"

	"pokemon-explorer-backend/auth"
)

type User struct {
	ID    int64
	Email string
	Role  string
}

type contextKey string

const userKey contextKey = "user"

func WhoFrom(ctx context.Context) User {
	user, ok := ctx.Value(userKey).(User)
	if !ok {
		return User{}
	}
	return user
}

func Auth(secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")

			if !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "กรุณาเข้าสู่ระบบ", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			if tokenString == "" {
				http.Error(w, "Token ไม่ถูกต้อง", http.StatusUnauthorized)
				return
			}

			claims, err := auth.ParseToken(tokenString, secret)
			if err != nil {
				http.Error(w, "Token ไม่ถูกต้องหรือหมดอายุ", http.StatusUnauthorized)
				return
			}

			user := User{
				ID:    claims.MemberID,
				Email: claims.Email,
				Role:  claims.Role,
			}

			ctx := context.WithValue(r.Context(), userKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// AdminOnly อนุญาตเฉพาะสมาชิกที่มี role เป็น admin
func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := WhoFrom(r.Context())

		if user.Role != "admin" {
			http.Error(w, "ไม่มีสิทธิ์เข้าถึงส่วนนี้", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}
