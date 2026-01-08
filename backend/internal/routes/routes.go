package routes

import (
	"context"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"

	"shotify/internal/config"
	"shotify/internal/handler"
	"shotify/internal/middleware"
	"shotify/internal/repository"
	"shotify/internal/services"
	"shotify/pkg/logger"
	"shotify/pkg/storage"
)

func Setup(router *gin.Engine, db *mongo.Database, s3Client *storage.S3Client, cfg *config.Config) {
	userRepo := repository.NewUserRepository(db)
	templateRepo := repository.NewTemplateRepository(db)
	projectRepo := repository.NewProjectRepository(db)

	authService := services.NewAuthService(userRepo, cfg)
	templateService := services.NewTemplateService(templateRepo)
	projectService := services.NewProjectService(projectRepo, templateRepo)
	uploadService := services.NewUploadService(s3Client, cfg)

	authHandler := handler.NewAuthHandler(authService)
	templateHandler := handler.NewTemplateHandler(templateService)
	projectHandler := handler.NewProjectHandler(projectService)
	uploadHandler := handler.NewUploadHandler(uploadService)
	proxyHandler := handler.NewProxyHandler()

	if err := templateService.SeedTemplates(context.Background()); err != nil {
		logger.Error("Failed to seed templates", err)
	}

	router.Use(middleware.CORSMiddleware(cfg))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "shotify-api",
		})
	})

	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		api.GET("/proxy-image", proxyHandler.ProxyImage)

		api.GET("/get-templates", templateHandler.GetTemplates)
		api.GET("/get-template-byId/:id", templateHandler.GetTemplateByID)

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.GET("/auth/me", authHandler.GetMe)
			protected.POST("/create-project", projectHandler.CreateProject)
			protected.GET("/get-projects", projectHandler.GetProjects)
			protected.GET("/get-project-byId/:id", projectHandler.GetProjectByID)
			protected.PUT("/update-project/:id", projectHandler.UpdateProject)
			protected.DELETE("/delete-projects/:id", projectHandler.DeleteProject)
			protected.POST("/uploads/image", uploadHandler.UploadImage)
		}
	}
}
