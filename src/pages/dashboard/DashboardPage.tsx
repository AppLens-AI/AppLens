import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/types";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FolderOpen,
  Smartphone,
  Search,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpenId]);

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      setProjects(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectsApi.delete(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeleteId(null);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(160 84% 39% / 0.15), transparent)",
        }}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Your Projects
            </h1>
            <p className="text-muted-foreground">
              Create beautiful app screenshots in minutes
            </p>
          </div>

          <Link
            to="/templates"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
          >
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {projects.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Projects
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {
                      projects.filter(
                        (p) =>
                          new Date(p.updatedAt) >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      ).length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground">
              Loading your projects...
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center">
            <div className="inline-flex p-6 bg-secondary rounded-2xl mb-6">
              <FolderOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              {searchQuery ? "No projects found" : "Start your first project"}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create stunning app store screenshots with our beautiful templates"}
            </p>
            {!searchQuery && (
              <Link
                to="/templates"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/editor/${project.id}`)}
              >
                <div className="flex gap-4 p-4">
                  <div className="w-40 h-56 bg-secondary rounded-lg overflow-hidden flex-shrink-0 relative">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Smartphone className="w-12 h-12 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">
                          No preview
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col py-2">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>

                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(
                              menuOpenId === project.id ? null : project.id,
                            );
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {menuOpenId === project.id && (
                          <div
                            className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                navigate(`/editor/${project.id}`);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit Project
                            </button>
                            <div className="h-px bg-border" />
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                setDeleteId(project.id);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      <span>
                        Updated {formatDistanceToNow(project.updatedAt)}
                      </span>
                    </div>

                    <div className="flex-1" />

                    <div className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                      Open Editor
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Delete Project?
              </h3>
              <p className="text-muted-foreground">
                This action cannot be undone. All project data will be
                permanently removed.
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-secondary/50 border-t border-border">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-3 text-foreground font-medium bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-3 text-white font-medium bg-destructive rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
