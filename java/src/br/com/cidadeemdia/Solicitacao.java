package br.com.cidadeemdia;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Solicitação de zeladoria urbana, principal entidade do domínio.
 */
public class Solicitacao {
    private static final int TAMANHO_MINIMO_ENDERECO = 5;
    private static final int TAMANHO_MINIMO_DESCRICAO = 10;

    // Formato básico: texto@texto.texto, sem espaços.
    private static final Pattern FORMATO_EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final String protocolo;
    private final Categoria categoria;
    private final String endereco;
    private final String descricao;
    private final String pontoReferencia;
    private final String nome;
    private final String email;
    private StatusSolicitacao statusAtual;
    private final List<HistoricoStatus> historico = new ArrayList<>();

    public Solicitacao(
            String protocolo,
            Categoria categoria,
            String endereco,
            String descricao,
            String pontoReferencia,
            String nome,
            String email) {
        if (protocolo == null || protocolo.isBlank()) {
            throw new IllegalArgumentException("O protocolo é obrigatório.");
        }
        validarDados(categoria, endereco, descricao, email);

        this.protocolo = protocolo;
        this.categoria = categoria;
        this.endereco = textoOuVazio(endereco);
        this.descricao = textoOuVazio(descricao);
        this.pontoReferencia = opcional(pontoReferencia);
        this.nome = opcional(nome);
        this.email = opcional(email);

        // Toda nova solicitação começa como RECEBIDA, também registrada no histórico.
        this.statusAtual = StatusSolicitacao.RECEBIDA;
        this.historico.add(new HistoricoStatus(StatusSolicitacao.RECEBIDA, LocalDateTime.now(), null));
    }

    /**
     * Valida os dados informados no cadastro.
     *
     * Usado pelo construtor e também pelo serviço antes de gerar o protocolo,
     * para que dados inválidos não consumam um número da sequência.
     *
     * @throws IllegalArgumentException quando algum dado é inválido
     */
    public static void validarDados(Categoria categoria, String endereco, String descricao, String email) {
        if (categoria == null) {
            throw new IllegalArgumentException("A categoria é obrigatória.");
        }
        if (textoOuVazio(endereco).length() < TAMANHO_MINIMO_ENDERECO) {
            throw new IllegalArgumentException(
                    "O endereço deve possuir no mínimo " + TAMANHO_MINIMO_ENDERECO + " caracteres.");
        }
        if (textoOuVazio(descricao).length() < TAMANHO_MINIMO_DESCRICAO) {
            throw new IllegalArgumentException(
                    "A descrição deve possuir no mínimo " + TAMANHO_MINIMO_DESCRICAO + " caracteres.");
        }
        String emailTratado = opcional(email);
        if (emailTratado != null && !FORMATO_EMAIL.matcher(emailTratado).matches()) {
            throw new IllegalArgumentException("O e-mail informado não possui um formato válido.");
        }
    }

    /**
     * Altera o status atual e acrescenta um novo evento ao histórico.
     *
     * Qualquer status é aceito, inclusive repetido ou anterior ao atual.
     * Os eventos anteriores são preservados.
     */
    public void atualizarStatus(StatusSolicitacao novoStatus, String observacao) {
        if (novoStatus == null) {
            throw new IllegalArgumentException("O novo status é obrigatório.");
        }
        this.statusAtual = novoStatus;
        this.historico.add(new HistoricoStatus(novoStatus, LocalDateTime.now(), opcional(observacao)));
    }

    public String getProtocolo() {
        return protocolo;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public String getEndereco() {
        return endereco;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getPontoReferencia() {
        return pontoReferencia;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public StatusSolicitacao getStatusAtual() {
        return statusAtual;
    }

    /** Retorna o histórico somente para leitura, evitando alterações externas. */
    public List<HistoricoStatus> getHistorico() {
        return Collections.unmodifiableList(historico);
    }

    private static String textoOuVazio(String texto) {
        return texto == null ? "" : texto.trim();
    }

    /** Campos opcionais em branco são armazenados como null. */
    private static String opcional(String texto) {
        String tratado = textoOuVazio(texto);
        return tratado.isEmpty() ? null : tratado;
    }
}
