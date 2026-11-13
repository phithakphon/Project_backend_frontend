package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	MemberID int64  `json:"member_id"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken สร้าง JWT สำหรับสมาชิก
func GenerateToken(
	memberID int64,
	email string,
	role string,
	secret []byte,
) (string, error) {
	claims := Claims{
		MemberID: memberID,
		Email:    email,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString(secret)
}

// ParseToken ตรวจสอบ JWT และคืนข้อมูลสมาชิก
func ParseToken(tokenString string, secret []byte) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, errors.New("วิธีลงนาม Token ไม่ถูกต้อง")
			}
			return secret, nil
		},
	)

	if err != nil || !token.Valid {
		return nil, errors.New("Token ไม่ถูกต้องหรือหมดอายุ")
	}

	return claims, nil
}
