package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"shotify/internal/models"
	"shotify/internal/services"
	"shotify/internal/utils"
)

type ProjectHandler struct {
	projectService *services.ProjectService
}

func NewProjectHandler(projectService *services.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
	}
}

// CreateProject creates a new project
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err.Error())
		return
	}

	project, err := h.projectService.CreateProject(c.Request.Context(), userID.(string), &req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create project", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Project created successfully", project)
}

// GetProjects returns all projects for the authenticated user
func (h *ProjectHandler) GetProjects(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	projects, err := h.projectService.GetUserProjects(c.Request.Context(), userID.(string))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch projects", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Projects retrieved successfully", projects)
}

// GetProjectByID returns a specific project
func (h *ProjectHandler) GetProjectByID(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", "Project ID is required")
		return
	}

	project, err := h.projectService.GetProjectByID(c.Request.Context(), projectID, userID.(string))
	if err != nil {
		if err.Error() == "project not found" {
			utils.ErrorResponse(c, http.StatusNotFound, "Project not found", "")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch project", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Project retrieved successfully", project)
}

// UpdateProject updates a project
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", "Project ID is required")
		return
	}

	var req models.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err.Error())
		return
	}

	project, err := h.projectService.UpdateProject(c.Request.Context(), projectID, userID.(string), &req)
	if err != nil {
		if err.Error() == "project not found" {
			utils.ErrorResponse(c, http.StatusNotFound, "Project not found", "")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update project", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Project updated successfully", project)
}

// DeleteProject deletes a project
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Unauthorized", "User ID not found")
		return
	}

	projectID := c.Param("id")
	if projectID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", "Project ID is required")
		return
	}

	err := h.projectService.DeleteProject(c.Request.Context(), projectID, userID.(string))
	if err != nil {
		if err.Error() == "project not found or unauthorized" {
			utils.ErrorResponse(c, http.StatusNotFound, "Project not found", "")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete project", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Project deleted successfully", nil)
}
