package br.com.cidadeemdia;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Registra, consulta e atualiza solicitações mantidas em memória.
 */
public class SolicitacaoService {
    private final Map<String, Solicitacao> solicitacoes = new HashMap<>();
    private final GeradorProtocolo geradorProtocolo;

    public SolicitacaoService(GeradorProtocolo geradorProtocolo) {
        if (geradorProtocolo == null) {
            throw new IllegalArgumentException("O gerador de protocolo é obrigatório.");
        }
        this.geradorProtocolo = geradorProtocolo;
    }

    public Solicitacao registrar(
            Categoria categoria,
            String endereco,
            String descricao,
            String pontoReferencia,
            String nome,
            String email) {
        // Valida antes de gerar o protocolo para não consumir a sequência com dados inválidos.
        Solicitacao.validarDados(categoria, endereco, descricao, email);
        String protocolo = geradorProtocolo.gerar();
        Solicitacao solicitacao =
                new Solicitacao(protocolo, categoria, endereco, descricao, pontoReferencia, nome, email);
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

    /**
     * Atualiza o status e registra a observação no histórico.
     * O protocolo da solicitação não é alterado.
     */
    public Solicitacao atualizarStatus(String protocolo, StatusSolicitacao novoStatus, String observacao) {
        Solicitacao solicitacao = buscarPorProtocolo(protocolo);
        solicitacao.atualizarStatus(novoStatus, observacao);
        return solicitacao;
    }
}
