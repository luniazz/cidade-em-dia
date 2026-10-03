package br.com.cidadeemdia;

import java.time.format.DateTimeFormatter;
import java.util.NoSuchElementException;

/**
 * Demonstração no terminal do fluxo principal de uma solicitação.
 */
public class Main {
    private static final DateTimeFormatter FORMATO_DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final String LINHA = "=".repeat(60);
    private static final String SEPARADOR = "-".repeat(60);

    public static void main(String[] args) {
        SolicitacaoService service = new SolicitacaoService(new GeradorProtocolo());

        System.out.println(LINHA);
        System.out.println("Cidade em Dia - Demonstração Java");
        System.out.println(LINHA);

        // 1. Registro
        System.out.println();
        System.out.println("1. Registrando nova solicitação...");
        Solicitacao registrada = service.registrar(
                Categoria.BURACOS_EM_VIAS,
                "Avenida Paulista, 1000",
                "Buraco de grande porte próximo à faixa de pedestres.",
                null,
                null,
                null);
        System.out.println("   Protocolo gerado: " + registrada.getProtocolo());
        System.out.println("   Categoria:        " + registrada.getCategoria().getDescricao());
        System.out.println("   Status inicial:   " + formatarStatus(registrada.getStatusAtual()));

        // 2. Consulta
        System.out.println();
        System.out.println(SEPARADOR);
        System.out.println("2. Consultando pelo protocolo " + registrada.getProtocolo() + "...");
        Solicitacao consultada = service.buscarPorProtocolo(registrada.getProtocolo());
        System.out.println("   Solicitação encontrada.");
        System.out.println("   Endereço:         " + consultada.getEndereco());
        System.out.println("   Descrição:        " + consultada.getDescricao());
        System.out.println("   Status atual:     " + formatarStatus(consultada.getStatusAtual()));

        // 3. Atualização de status
        System.out.println();
        System.out.println(SEPARADOR);
        System.out.println("3. Atualizando status para " + formatarStatus(StatusSolicitacao.EM_ANALISE) + "...");
        Solicitacao atualizada = service.atualizarStatus(
                consultada.getProtocolo(),
                StatusSolicitacao.EM_ANALISE,
                "Solicitação encaminhada para análise da equipe responsável.");
        System.out.println("   Protocolo:        " + atualizada.getProtocolo());
        System.out.println("   Status atual:     " + formatarStatus(atualizada.getStatusAtual()));
        System.out.println();
        System.out.println("   Histórico:");
        int numero = 1;
        for (HistoricoStatus evento : atualizada.getHistorico()) {
            System.out.println("   " + numero + ". " + evento.getDataHora().format(FORMATO_DATA_HORA)
                    + " | " + formatarStatus(evento.getStatus()));
            System.out.println("      Observação: "
                    + (evento.possuiObservacao() ? evento.getObservacao() : "(sem observação)"));
            numero++;
        }

        // 4. Protocolo inexistente
        System.out.println();
        System.out.println(SEPARADOR);
        System.out.println("4. Consultando um protocolo inexistente...");
        try {
            service.buscarPorProtocolo("HGV-2000-99999");
        } catch (NoSuchElementException e) {
            System.out.println("   Aviso: " + e.getMessage());
        }

        System.out.println();
        System.out.println(LINHA);
        System.out.println("Demonstração concluída.");
        System.out.println(LINHA);
    }

    private static String formatarStatus(StatusSolicitacao status) {
        return status.getDescricao() + " (" + status.name() + ")";
    }
}
