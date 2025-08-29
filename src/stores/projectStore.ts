import { create } from 'zustand'
import { Project } from '@/types/planning'

interface ProjectState {
  currentProject: Project | null
  selectedProjects: string[]
  projectFilter: {
    type?: 'proposal' | 'development' | 'operation'
    status?: string
    search?: string
  }
  setCurrentProject: (project: Project | null) => void
  setSelectedProjects: (ids: string[]) => void
  addSelectedProject: (id: string) => void
  removeSelectedProject: (id: string) => void
  clearSelectedProjects: () => void
  setProjectFilter: (filter: ProjectState['projectFilter']) => void
  clearProjectFilter: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  selectedProjects: [],
  projectFilter: {},
  setCurrentProject: (project) => set({ currentProject: project }),
  setSelectedProjects: (ids) => set({ selectedProjects: ids }),
  addSelectedProject: (id) => 
    set((state) => ({ 
      selectedProjects: [...state.selectedProjects, id] 
    })),
  removeSelectedProject: (id) =>
    set((state) => ({
      selectedProjects: state.selectedProjects.filter(pId => pId !== id)
    })),
  clearSelectedProjects: () => set({ selectedProjects: [] }),
  setProjectFilter: (filter) => 
    set((state) => ({ 
      projectFilter: { ...state.projectFilter, ...filter } 
    })),
  clearProjectFilter: () => set({ projectFilter: {} })
}))