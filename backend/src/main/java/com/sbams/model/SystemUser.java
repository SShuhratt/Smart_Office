package com.sbams.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Builder.Default
    private boolean enabled = true;
}
