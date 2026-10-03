package br.com.cidadeemdia;

/**
 * Status oficiais de uma solicitação.
 *
 * Não existem regras de transição: qualquer status pode ser selecionado.
 */
public enum StatusSolicitacao {
    RECEBIDA("Recebida"),
    EM_ANALISE("Em análise"),
    PROGRAMADA("Programada"),
    EM_EXECUCAO("Em execução"),
    RESOLVIDA("Resolvida");

    private final String descricao;

    StatusSolicitacao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
