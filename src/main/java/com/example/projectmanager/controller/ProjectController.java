package com.example.projectmanager.controller;

import com.example.projectmanager.dto.ProjectRequest;
import com.example.projectmanager.dto.UserResponse;
import com.example.projectmanager.model.Project;
import com.example.projectmanager.model.User;
import com.example.projectmanager.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService service;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(service.getAllProjects());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createProject(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getProjectById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(
            @PathVariable Integer id,
            @Valid @RequestBody ProjectRequest request
    ) {
        return ResponseEntity.ok(service.updateProject(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProject(@PathVariable Integer id) {
        service.deleteProject(id);
        return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Map<String, String>> addMember(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request
    ) {
        service.addMemberToProject(id, request.get("email"));
        return ResponseEntity.ok(Map.of("message", "Member added successfully"));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<UserResponse>> getMembers(@PathVariable Integer id) {
        List<User> members = service.getProjectMembers(id);
        List<UserResponse> responses = members.stream()
                .map(u -> UserResponse.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}/members")
    public ResponseEntity<Map<String, String>> removeMember(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request
    ) {
        service.removeMemberFromProject(id, request.get("email"));
        return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
    }
}
