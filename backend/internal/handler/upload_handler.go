package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"shotify/internal/services"
	"shotify/internal/utils"
)

type UploadHandler struct {
	uploadService *services.UploadService
}

func NewUploadHandler(uploadService *services.UploadService) *UploadHandler {
	return &UploadHandler{
		uploadService: uploadService,
	}
}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", "Image file is required")
		return
	}

	result, err := h.uploadService.UploadImage(c.Request.Context(), userID.(string), file)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Upload failed", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Image uploaded successfully", result)
}
