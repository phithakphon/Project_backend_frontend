package auth

import "golang.org/x/crypto/bcrypt"

// HashPassword เข้ารหัสรหัสผ่านก่อนบันทึกลงฐานข้อมูล
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

// CheckPassword ตรวจสอบรหัสผ่านกับ Hash ที่เก็บในฐานข้อมูล
func CheckPassword(password, passwordHash string) error {
	return bcrypt.CompareHashAndPassword(
		[]byte(passwordHash),
		[]byte(password),
	)
}
