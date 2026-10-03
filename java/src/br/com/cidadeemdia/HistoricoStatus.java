package br.com.cidadeemdia;

import java.time.LocalDateTime;

/**
 * Evento do histórico de uma solicitação.
 *
 * Os campos são finais: depois de registrado, um evento não é alterado.
 */
public class HistoricoStatus {
    private final StatusSolicitacao status;
    private final LocalDateTime dataHora;
    private final String observacao;

    public HistoricoStatus(StatusSolicitacao status, LocalDateTime dataHora, String observacao) {
        if (status == null) {
            throw new IllegalArgumentException("O status do histórico é obrigatório.");
        }
        if (dataHora == null) {
            throw new IllegalArgumentException("A data e hora do histórico são obrigatórias.");
        }
        this.status = status;
        this.dataHora = dataHora;
        this.observacao = observacao;
    }

    public StatusSolicitacao getStatus() {
        return status;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    /** Pode ser nula ou vazia. */
    public String getObservacao() {
        return observacao;
    }

    public boolean possuiObservacao() {
        return observacao != null && !observacao.isBlank();
    }
}
