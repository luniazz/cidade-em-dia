package br.com.cidadeemdia;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Registra, consulta, lista e atualiza solicitações mantidas em memória.
 */
public class SolicitacaoService {
    // LinkedHashMap preserva a ordem de registro na listagem.
    private final Map<String, Solicitacao> solicitacoes = new LinkedHashMap<>();
    private final GeradorProtocolo geradorProtocolo;

    public SolicitacaoService(GeradorProtocolo geradorProtocolo) {
        if (geradorProtocolo == null) {
            throw new IllegalArgumentException("O gerador de protocolo é obrigatório.");
        }
        this.geradorProtocolo = geradorProtocolo;
    }

    /** Registra uma solicitação anônima e sem anexo, como na Fase 2. */
    public Solicitacao registrar(
            Categoria categoria,
            String endereco,
            String descricao,
            String pontoReferencia,
            String nome,
            String email) {
        return registrar(categoria, endereco, descricao, pontoReferencia, nome, email, null, null);
    }

    /**
     * Registra uma solicitação, opcionalmente associada a um cidadão e com foto.
     *
     * @param usuario cidadão autenticado, ou null para solicitação anônima
     * @param anexo   foto opcional, ou null
     */
    public Solicitacao registrar(
            Categoria categoria,
            String endereco,
            String descricao,
            String pontoReferencia,
            String nome,
            String email,
            Usuario usuario,
            Anexo anexo) {
        // Valida antes de gerar o protocolo para não consumir a sequência com dados inválidos.
        Solicitacao.validarDados(categoria, endereco, descricao, email);
        Solicitacao.validarUsuario(usuario);
        String protocolo = geradorProtocolo.gerar();
        Solicitacao solicitacao = new Solicitacao(
                protocolo, categoria, endereco, descricao, pontoReferencia, nome, email, usuario, anexo);
        solicitacoes.put(protocolo, solicitacao);
        return solicitacao;
    }

    /**
     * @throws NoSuchElementException quando nenhuma solicitação possui o protocolo informado
     */
    public Solicitacao buscarPorProtocolo(String protocolo) {
        String protocoloTratado = protocolo == null ? "" : protocolo.trim().toUpperCase();
        Solicitacao solicitacao = solicitacoes.get(protocoloTratado);
        if (solicitacao == null) {
            throw new NoSuchElementException(
                    "Nenhuma solicitação encontrada para o protocolo \"" + protocolo + "\".");
        }
        return solicitacao;
    }

    /** Todas as solicitações, na ordem de registro, somente para leitura. */
    public List<Solicitacao> listar() {
        return List.copyOf(solicitacoes.values());
    }

    public List<Solicitacao> filtrarPorCategoria(Categoria categoria) {
        return solicitacoes.values().stream()
                .filter(s -> s.getCategoria() == categoria)
                .toList();
    }

    public List<Solicitacao> filtrarPorStatus(StatusSolicitacao status) {
        return solicitacoes.values().stream()
                .filter(s -> s.getStatusAtual() == status)
                .toList();
    }

    /**
     * Atualiza o status e registra a observação no histórico.
     * O protocolo da solicitação não é alterado.
     */
    public Solicitacao atualizarStatus(String protocolo, StatusSolicitacao novoStatus, String observacao) {
        Solicitacao solicitacao = buscarPorProtocolo(protocolo);
        solicitacao.atualizarStatus(novoStatus, observacao);
        return solicitacao;
    }

    /**
     * Atualização feita na Área da Prefeitura: exige um usuário com perfil Atendente.
     *
     * @throws SecurityException quando o usuário não é um atendente
     */
    public Solicitacao atualizarStatus(
            Usuario responsavel, String protocolo, StatusSolicitacao novoStatus, String observacao) {
        if (responsavel == null || !responsavel.possuiPerfil(PerfilUsuario.ATENDENTE)) {
            throw new SecurityException("Somente atendentes podem atualizar o status de uma solicitação.");
        }
        return atualizarStatus(protocolo, novoStatus, observacao);
    }
}
