package com.example.projectmanager.service;

import com.example.projectmanager.dto.TaskRequest;
import com.example.projectmanager.exception.ResourceNotFoundException;
import com.example.projectmanager.model.Project;
import com.example.projectmanager.model.Task;
import com.example.projectmanager.model.User;
import com.example.projectmanager.repository.ProjectRepository;
import com.example.projectmanager.repository.TaskRepository;
import com.example.projectmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository repository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public List<Task> getTasksByProject(Integer projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        return repository.findByProject(project);
    }

    public Task createTask(Integer projectId, TaskRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        User assignee = userRepository.findByEmail(request.getAssigneeEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getAssigneeEmail()));

        LocalDateTime dueDate = null;
        if (request.getDueDate() != null && !request.getDueDate().isEmpty()) {
            dueDate = LocalDateTime.parse(request.getDueDate() + "T23:59:59");
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(Task.Status.TODO)
                .project(project)
                .assignedTo(assignee)
                .dueDate(dueDate)
                .build();
        return repository.save(task);
    }

    public Task updateTaskStatus(Integer taskId, String status) {
        Task task = repository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        task.setStatus(Task.Status.valueOf(status.toUpperCase()));
        return repository.save(task);
    }

    public Task updateTask(Integer taskId, TaskRequest request) {
        Task task = repository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());

        if (request.getAssigneeEmail() != null) {
            User assignee = userRepository.findByEmail(request.getAssigneeEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getAssigneeEmail()));
            task.setAssignedTo(assignee);
        }

        if (request.getDueDate() != null && !request.getDueDate().isEmpty()) {
            task.setDueDate(LocalDateTime.parse(request.getDueDate() + "T23:59:59"));
        }

        return repository.save(task);
    }

    public void deleteTask(Integer taskId) {
        Task task = repository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        repository.delete(task);
    }

    public List<Task> getMyTasks(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Task> tasks = repository.findByAssignedTo(user);
        updateOverdueTasks(tasks);
        return tasks;
    }

    public void updateOverdueTasks(List<Task> tasks) {
        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;
        for (Task task : tasks) {
            if (task.getStatus() != Task.Status.COMPLETED &&
                task.getDueDate() != null &&
                task.getDueDate().isBefore(now)) {
                task.setStatus(Task.Status.OVERDUE);
                changed = true;
            }
        }
        if (changed) {
            repository.saveAll(tasks);
        }
    }
}
