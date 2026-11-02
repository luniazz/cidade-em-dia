package br.com.cidadeemdia;

/**
 * Usuário autenticado. Contém apenas dados públicos: a senha fica restrita ao
 * {@link AuthService}.
 */
public class Usuario {
    private final String id;
    private final String nome;
    private final String email;
    private final PerfilUsuario perfil;

    public Usuario(String id, String nome, String email, PerfilUsuario perfil) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("O id do usuário é obrigatório.");
        }
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("O nome do usuário é obrigatório.");
        }
        if (email == null || !Solicitacao.emailValido(email.trim())) {
            throw new IllegalArgumentException("O e-mail do usuário é obrigatório e deve ser válido.");
        }
        if (perfil == null) {
            throw new IllegalArgumentException("O perfil do usuário é obrigatório.");
        }
        this.id = id.trim();
        this.nome = nome.trim();
        this.email = email.trim();
        this.perfil = perfil;
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public PerfilUsuario getPerfil() {
        return perfil;
    }

    public boolean possuiPerfil(PerfilUsuario perfilEsperado) {
        return perfil == perfilEsperado;
    }
}
