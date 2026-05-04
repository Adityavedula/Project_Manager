package com.example.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "task")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String title;
    
    private String description;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime dueDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id")
    @JsonIgnoreProperties({"tasks", "members"})
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to_id")
    @JsonIgnoreProperties({"password", "authorities"})
    private User assignedTo;

    public String getDueDateString() {
        return dueDate != null ? dueDate.format(DateTimeFormatter.ISO_LOCAL_DATE) : null;
    }

    public enum Status {
        TODO,
        IN_PROGRESS,
        COMPLETED,
        OVERDUE
    }
}
