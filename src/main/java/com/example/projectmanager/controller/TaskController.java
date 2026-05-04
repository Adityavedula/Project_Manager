package com.example.projectmanager.controller;

import com.example.projectmanager.dto.TaskRequest;
import com.example.projectmanager.model.Task;
import com.example.projectmanager.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService service;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable Integer projectId) {
        return ResponseEntity.ok(service.getTasksByProject(projectId));
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<Task> createTask(
            @PathVariable Integer projectId,
            @Valid @RequestBody TaskRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createTask(projectId, request));
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<Task> updateTaskStatus(
            @PathVariable Integer taskId,
            @RequestBody Map<String, String> statusMap
    ) {
        return ResponseEntity.ok(service.updateTaskStatus(taskId, statusMap.get("status")));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Integer taskId,
            @Valid @RequestBody TaskRequest request
    ) {
        return ResponseEntity.ok(service.updateTask(taskId, request));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Map<String, String>> deleteTask(@PathVariable Integer taskId) {
        service.deleteTask(taskId);
        return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Task>> getMyTasks() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(service.getMyTasks(email));
    }
}
