package br.com.cidadeemdia;

/**
 * Categorias oficiais de solicitação de zeladoria urbana.
 */
public enum Categoria {
    BURACOS_EM_VIAS("Buracos em vias"),
    ILUMINACAO_PUBLICA("Iluminação pública"),
    DESCARTE_IRREGULAR_RESIDUOS("Descarte irregular de resíduos"),
    PODA_ARVORES("Poda de árvores"),
    SINALIZACAO("Sinalização");

    private final String descricao;

    Categoria(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
