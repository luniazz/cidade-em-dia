package br.com.cidadeemdia;

import java.time.Year;

/**
 * Gera protocolos no formato HGV-AAAA-NNNNN.
 *
 * A sequência é mantida apenas em memória, enquanto o programa estiver em execução.
 */
public class GeradorProtocolo {
    private static final int SEQUENCIA_MAXIMA = 99999;

    private final int ano;
    private int ultimaSequencia = 0;

    /** Usa o ano atual. */
    public GeradorProtocolo() {
        this(Year.now().getValue());
    }

    public GeradorProtocolo(int ano) {
        if (ano < 1000 || ano > 9999) {
            throw new IllegalArgumentException("O ano do protocolo deve possuir quatro dígitos.");
        }
        this.ano = ano;
    }

    public String gerar() {
        if (ultimaSequencia >= SEQUENCIA_MAXIMA) {
            throw new IllegalStateException("A sequência de protocolos do ano " + ano + " foi esgotada.");
        }
        ultimaSequencia++;
        return String.format("HGV-%d-%05d", ano, ultimaSequencia);
    }
}
