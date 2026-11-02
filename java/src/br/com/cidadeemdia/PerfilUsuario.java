package br.com.cidadeemdia;

/**
 * Perfis de usuário reconhecidos pela autenticação demonstrativa.
 */
public enum PerfilUsuario {
    CIDADAO("Cidadão"),
    ATENDENTE("Atendente");

    private final String descricao;

    PerfilUsuario(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
