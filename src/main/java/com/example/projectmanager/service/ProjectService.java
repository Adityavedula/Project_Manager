package com.example.projectmanager.service;

import com.example.projectmanager.dto.ProjectRequest;
import com.example.projectmanager.exception.ResourceNotFoundException;
import com.example.projectmanager.exception.UnauthorizedException;
import com.example.projectmanager.model.Project;
import com.example.projectmanager.model.User;
import com.example.projectmanager.repository.ProjectRepository;
import com.example.projectmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository repository;
    private final UserRepository userRepository;

    public List<Project> getAllProjects() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return repository.findAll();
    }

    public Project createProject(ProjectRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != User.Role.ADMIN) {
            throw new UnauthorizedException("Only admins can create projects");
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(user)
                .build();
        return repository.save(project);
    }

    public Project getProjectById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    public Project updateProject(Integer id, ProjectRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (user.getRole() != User.Role.ADMIN && !project.getOwner().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only edit your own projects");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        return repository.save(project);
    }

    public void deleteProject(Integer id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (user.getRole() != User.Role.ADMIN) {
            throw new UnauthorizedException("Only admins can delete projects");
        }

        repository.delete(project);
    }

    public void addMemberToProject(Integer projectId, String memberEmail) {
        Project project = repository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        User member = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + memberEmail));

        if (project.getMembers() == null) {
            project.setMembers(new java.util.ArrayList<>());
        }
        if (!project.getMembers().contains(member)) {
            project.getMembers().add(member);
            repository.save(project);
        }
    }

    public List<User> getProjectMembers(Integer projectId) {
        Project project = repository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        return project.getMembers() != null ? project.getMembers() : List.of();
    }

    public void removeMemberFromProject(Integer projectId, String memberEmail) {
        Project project = repository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        User member = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + memberEmail));

        if (project.getMembers() != null) {
            project.getMembers().remove(member);
            repository.save(project);
        }
    }
}
