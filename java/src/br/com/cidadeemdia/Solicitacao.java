package br.com.cidadeemdia;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Solicitação de zeladoria urbana, principal entidade do domínio.
 *
 * Pode ser anônima ou associada a um cidadão autenticado, e pode ter uma foto
 * ({@link Anexo}) opcional.
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
    private final Usuario usuario;
    private final Anexo anexo;
    private StatusSolicitacao statusAtual;
    private final List<HistoricoStatus> historico = new ArrayList<>();

    /** Solicitação anônima e sem anexo, como na Fase 2. */
    public Solicitacao(
            String protocolo,
            Categoria categoria,
            String endereco,
            String descricao,
            String pontoReferencia,
            String nome,
            String email) {
        this(protocolo, categoria, endereco, descricao, pontoReferencia, nome, email, null, null);
    }

    /**
     * @param nome    contato informado no formulário; se ausente, vale o nome do usuário
     * @param email   contato informado no formulário; se ausente, vale o e-mail do usuário
     * @param usuario cidadão autenticado que registrou a solicitação, ou null se anônima
     * @param anexo   foto opcional, ou null
     */
    public Solicitacao(
            String protocolo,
            Categoria categoria,
            String endereco,
            String descricao,
            String pontoReferencia,
            String nome,
            String email,
            Usuario usuario,
            Anexo anexo) {
        if (protocolo == null || protocolo.isBlank()) {
            throw new IllegalArgumentException("O protocolo é obrigatório.");
        }
        validarDados(categoria, endereco, descricao, email);
        validarUsuario(usuario);

        this.protocolo = protocolo;
        this.categoria = categoria;
        this.endereco = textoOuVazio(endereco);
        this.descricao = textoOuVazio(descricao);
        this.pontoReferencia = opcional(pontoReferencia);
        this.nome = opcional(nome);
        this.email = opcional(email);
        this.usuario = usuario;
        this.anexo = anexo;

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
        if (emailTratado != null && !emailValido(emailTratado)) {
            throw new IllegalArgumentException("O e-mail informado não possui um formato válido.");
        }
    }

    /**
     * Uma solicitação só pode ser associada a um cidadão; null indica anônima.
     *
     * @throws IllegalArgumentException quando o usuário não possui perfil Cidadão
     */
    public static void validarUsuario(Usuario usuario) {
        if (usuario != null && !usuario.possuiPerfil(PerfilUsuario.CIDADAO)) {
            throw new IllegalArgumentException("Somente cidadãos podem ser associados a uma solicitação.");
        }
    }

    /** Validação básica de e-mail, compartilhada com {@link Usuario}. */
    static boolean emailValido(String email) {
        return FORMATO_EMAIL.matcher(email).matches();
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

    /** Nome de contato: o informado ou, se ausente, o do usuário associado. Pode ser null. */
    public String getNome() {
        return nome != null || usuario == null ? nome : usuario.getNome();
    }

    /** E-mail de contato: o informado ou, se ausente, o do usuário associado. Pode ser null. */
    public String getEmail() {
        return email != null || usuario == null ? email : usuario.getEmail();
    }

    /** Cidadão associado, ou null quando a solicitação é anônima. */
    public Usuario getUsuario() {
        return usuario;
    }

    public boolean isAnonima() {
        return usuario == null;
    }

    /** Foto opcional, ou null. */
    public Anexo getAnexo() {
        return anexo;
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
