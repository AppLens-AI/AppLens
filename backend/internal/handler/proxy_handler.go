package handler

import (
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type ProxyHandler struct {
	httpClient *http.Client
}

func NewProxyHandler() *ProxyHandler {
	return &ProxyHandler{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (h *ProxyHandler) ProxyImage(c *gin.Context) {
	imageURL := c.Query("url")
	if imageURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url parameter is required"})
		return
	}

	decodedURL, err := url.QueryUnescape(imageURL)
	if err != nil {
		decodedURL = imageURL
	}

	parsedURL, err := url.Parse(decodedURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid URL"})
		return
	}

	// Optional: Restrict to only your S3 bucket for security
	// Uncomment and modify if you want to restrict to specific domains
	// allowedHosts := []string{"nextshines.s3.eu-north-1.amazonaws.com"}
	// isAllowed := false
	// for _, host := range allowedHosts {
	// 	if parsedURL.Host == host {
	// 		isAllowed = true
	// 		break
	// 	}
	// }
	// if !isAllowed {
	// 	c.JSON(http.StatusForbidden, gin.H{"error": "URL not allowed"})
	// 	return
	// }

	req, err := http.NewRequestWithContext(c.Request.Context(), "GET", decodedURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	req.Header.Set("User-Agent", "Shotify-Proxy/1.0")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch image"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"error": "upstream returned error", "status": resp.StatusCode})
		return
	}

	contentType := resp.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL does not point to an image"})
		return
	}

	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Content-Type")

	c.Header("Cache-Control", "public, max-age=31536000")

	c.Header("Content-Type", contentType)

	if resp.ContentLength > 0 {
		c.Header("Content-Length", string(rune(resp.ContentLength)))
	}

	c.Status(http.StatusOK)
	io.Copy(c.Writer, resp.Body)
}
