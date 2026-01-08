package services

import (
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"shotify/internal/models"
	"shotify/internal/repository"
)

type ProjectService struct {
	projectRepo  *repository.ProjectRepository
	templateRepo *repository.TemplateRepository
}

func NewProjectService(projectRepo *repository.ProjectRepository, templateRepo *repository.TemplateRepository) *ProjectService {
	return &ProjectService{
		projectRepo:  projectRepo,
		templateRepo: templateRepo,
	}
}

func (s *ProjectService) CreateProject(ctx context.Context, userID string, req *models.CreateProjectRequest) (*models.ProjectResponse, error) {
	userObjID, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	templateObjID, err := parseObjectID(req.TemplateID)
	if err != nil {
		return nil, errors.New("invalid template ID")
	}

	template, err := s.templateRepo.FindByID(ctx, templateObjID)
	if err != nil {
		return nil, err
	}
	if template == nil {
		return nil, errors.New("template not found")
	}

	project := &models.Project{
		UserID:     userObjID,
		TemplateID: templateObjID,
		Name:       req.Name,
		ProjectConfig: models.ProjectConfig{
			Canvas:  template.JSONConfig.Canvas,
			Layers:  template.JSONConfig.Layers,
			Images:  []models.ImageAsset{},
			Exports: template.JSONConfig.Exports,
		},
	}

	if err := s.projectRepo.Create(ctx, project); err != nil {
		return nil, err
	}

	return &models.ProjectResponse{
		ID:            project.ID.Hex(),
		UserID:        project.UserID.Hex(),
		TemplateID:    project.TemplateID.Hex(),
		Name:          project.Name,
		Thumbnail:     project.Thumbnail,
		ProjectConfig: project.ProjectConfig,
		Template:      template,
		CreatedAt:     project.CreatedAt,
		UpdatedAt:     project.UpdatedAt,
	}, nil
}

func (s *ProjectService) GetUserProjects(ctx context.Context, userID string) ([]models.ProjectResponse, error) {
	userObjID, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	projects, err := s.projectRepo.FindByUserID(ctx, userObjID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.ProjectResponse, len(projects))
	for i, p := range projects {
		responses[i] = models.ProjectResponse{
			ID:            p.ID.Hex(),
			UserID:        p.UserID.Hex(),
			TemplateID:    p.TemplateID.Hex(),
			Name:          p.Name,
			Thumbnail:     p.Thumbnail,
			ProjectConfig: p.ProjectConfig,
			CreatedAt:     p.CreatedAt,
			UpdatedAt:     p.UpdatedAt,
		}
	}

	return responses, nil
}

func (s *ProjectService) GetProjectByID(ctx context.Context, projectID, userID string) (*models.ProjectResponse, error) {
	projectObjID, err := parseObjectID(projectID)
	if err != nil {
		return nil, errors.New("invalid project ID")
	}

	userObjID, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	project, err := s.projectRepo.FindByIDAndUserID(ctx, projectObjID, userObjID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	template, _ := s.templateRepo.FindByID(ctx, project.TemplateID)

	return &models.ProjectResponse{
		ID:            project.ID.Hex(),
		UserID:        project.UserID.Hex(),
		TemplateID:    project.TemplateID.Hex(),
		Name:          project.Name,
		Thumbnail:     project.Thumbnail,
		ProjectConfig: project.ProjectConfig,
		Template:      template,
		CreatedAt:     project.CreatedAt,
		UpdatedAt:     project.UpdatedAt,
	}, nil
}

func (s *ProjectService) UpdateProject(ctx context.Context, projectID, userID string, req *models.UpdateProjectRequest) (*models.ProjectResponse, error) {
	projectObjID, err := parseObjectID(projectID)
	if err != nil {
		return nil, errors.New("invalid project ID")
	}

	userObjID, err := parseObjectID(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	project, err := s.projectRepo.FindByIDAndUserID(ctx, projectObjID, userObjID)
	if err != nil {
		return nil, err
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Thumbnail != "" {
		project.Thumbnail = req.Thumbnail
	}
	if req.ProjectConfig != nil {
		project.ProjectConfig = *req.ProjectConfig
	}

	if err := s.projectRepo.Update(ctx, project); err != nil {
		return nil, err
	}

	return &models.ProjectResponse{
		ID:            project.ID.Hex(),
		UserID:        project.UserID.Hex(),
		TemplateID:    project.TemplateID.Hex(),
		Name:          project.Name,
		Thumbnail:     project.Thumbnail,
		ProjectConfig: project.ProjectConfig,
		CreatedAt:     project.CreatedAt,
		UpdatedAt:     project.UpdatedAt,
	}, nil
}

func (s *ProjectService) DeleteProject(ctx context.Context, projectID, userID string) error {
	projectObjID, err := parseObjectID(projectID)
	if err != nil {
		return errors.New("invalid project ID")
	}

	userObjID, err := parseObjectID(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	return s.projectRepo.Delete(ctx, projectObjID, userObjID)
}

func parseObjectID(id string) (primitive.ObjectID, error) {
	return primitive.ObjectIDFromHex(id)
}
