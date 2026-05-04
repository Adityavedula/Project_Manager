package com.example.projectmanager.service;

import com.example.projectmanager.dto.DashboardStats;
import com.example.projectmanager.exception.ResourceNotFoundException;
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
public class DashboardService {
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public DashboardStats getStats() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        long totalProjects = projectRepository.count();
        List<Task> allTasks = taskRepository.findAll();
        List<Task> myTasks = taskRepository.findByAssignedTo(user);

        LocalDateTime now = LocalDateTime.now();
        long todoTasks = 0;
        long inProgressTasks = 0;
        long completedTasks = 0;
        long overdueTasks = 0;

        for (Task task : allTasks) {
            switch (task.getStatus()) {
                case TODO -> todoTasks++;
                case IN_PROGRESS -> inProgressTasks++;
                case COMPLETED -> completedTasks++;
                case OVERDUE -> overdueTasks++;
            }

            if (task.getStatus() != Task.Status.COMPLETED &&
                task.getDueDate() != null &&
                task.getDueDate().isBefore(now) &&
                task.getStatus() != Task.Status.OVERDUE) {
                task.setStatus(Task.Status.OVERDUE);
                overdueTasks++;
            }
        }

        taskRepository.saveAll(allTasks);

        return DashboardStats.builder()
                .totalProjects(totalProjects)
                .totalTasks(allTasks.size())
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .myTasks(myTasks.size())
                .build();
    }
}
