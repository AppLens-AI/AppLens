package services

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"shotify/internal/config"
	"shotify/pkg/storage"
)

type UploadService struct {
	s3Client *storage.S3Client
	config   *config.Config
}

func NewUploadService(s3Client *storage.S3Client, config *config.Config) *UploadService {
	return &UploadService{
		s3Client: s3Client,
		config:   config,
	}
}

type UploadResult struct {
	URL      string `json:"url"`
	Key      string `json:"key"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
}

func (s *UploadService) UploadImage(ctx context.Context, userID string, file *multipart.FileHeader) (*UploadResult, error) {
	if !isValidImageType(file.Filename) {
		return nil, fmt.Errorf("invalid file type: only PNG, JPG, JPEG, WebP allowed")
	}

	if file.Size > 10*1024*1024 {
		return nil, fmt.Errorf("file too large: max 10MB allowed")
	}

	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s-%s%s", time.Now().Format("20060102"), uuid.New().String()[:8], ext)
	key := fmt.Sprintf("uploads/%s/%s", userID, filename)

	contentType := getContentType(ext)

	url, err := s.s3Client.Upload(ctx, key, src, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to upload to S3: %w", err)
	}

	return &UploadResult{
		URL:      url,
		Key:      key,
		Filename: file.Filename,
		Size:     file.Size,
	}, nil
}

func (s *UploadService) DeleteImage(ctx context.Context, key string) error {
	return s.s3Client.Delete(ctx, key)
}

func isValidImageType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validTypes := map[string]bool{
		".png":  true,
		".jpg":  true,
		".jpeg": true,
		".webp": true,
	}
	return validTypes[ext]
}

func getContentType(ext string) string {
	contentTypes := map[string]string{
		".png":  "image/png",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".webp": "image/webp",
	}
	if ct, ok := contentTypes[strings.ToLower(ext)]; ok {
		return ct
	}
	return "application/octet-stream"
}
