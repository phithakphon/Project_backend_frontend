package handler

import "pokemon-explorer-backend/store"

type Handler struct {
	Store     *store.Store
	JWTSecret []byte
}

func New(s *store.Store, secret []byte) *Handler {
	return &Handler{
		Store:     s,
		JWTSecret: secret,
	}
}
