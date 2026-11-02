package br.com.cidadeemdia;

import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.NoSuchElementException;

/**
 * Demonstração no terminal do fluxo do Cidade em Dia: autenticação, registro
 * por cidadão e anônimo, consulta administrativa e atualização de status.
 */
public class Main {
    private static final DateTimeFormatter FORMATO_DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final Locale PT_BR = Locale.of("pt", "BR");
    private static final String LINHA = "=".repeat(60);
    private static final String SEPARADOR = "-".repeat(60);

    public static void main(String[] args) {
        AuthService authService = new AuthService();
        SolicitacaoService service = new SolicitacaoService(new GeradorProtocolo());

        System.out.println(LINHA);
        System.out.println("Cidade em Dia - Demonstração Java (Fase 3)");
        System.out.println(LINHA);

        // 1. Autenticação do cidadão
        titulo("1. Autenticando cidadão (cidadao@cidadeemdia.com.br)...");
        Usuario cidadao = authService.autenticar("cidadao@cidadeemdia.com.br", "cidadao123");
        System.out.println("   Login realizado com sucesso.");

        // 2. Dados do cidadão autenticado
        titulo("2. Dados do usuário autenticado");
        exibirUsuario(cidadao);

        // 3. Solicitação associada ao cidadão, com foto
        titulo("3. Registrando solicitação do cidadão, com foto...");
        Anexo foto = new Anexo("buraco-avenida.jpg", "image/jpeg", 2_400_000);
        Solicitacao doCidadao = service.registrar(
                Categoria.BURACOS_EM_VIAS,
                "Avenida Paulista, 1000",
                "Buraco de grande porte próximo à faixa de pedestres.",
                "Em frente ao museu",
                null,
                null,
                cidadao,
                foto);

        // 4. Protocolo gerado
        titulo("4. Solicitação registrada");
        exibirSolicitacao(doCidadao);

        // 5. Solicitação anônima
        titulo("5. Registrando solicitação anônima, sem foto...");
        Solicitacao anonima = service.registrar(
                Categoria.ILUMINACAO_PUBLICA,
                "Rua das Flores, 320",
                "Poste apagado há uma semana na esquina.",
                null,
                null,
                null);
        exibirSolicitacao(anonima);

        // 6. Autenticação do atendente
        titulo("6. Autenticando atendente (admin@cidadeemdia.gov.br)...");
        Usuario atendente = authService.autenticar("admin@cidadeemdia.gov.br", "admin123");
        exibirUsuario(atendente);

        // 7. Consulta administrativa
        titulo("7. Listando solicitações na Área da Prefeitura");
        for (Solicitacao s : service.listar()) {
            System.out.println("   " + s.getProtocolo()
                    + " | " + s.getCategoria().getDescricao()
                    + " | " + s.getStatusAtual().getDescricao()
                    + " | " + (s.isAnonima() ? "Anônima" : "Cidadão: " + s.getUsuario().getNome()));
        }
        System.out.println("   Filtro por categoria \"" + Categoria.ILUMINACAO_PUBLICA.getDescricao() + "\": "
                + service.filtrarPorCategoria(Categoria.ILUMINACAO_PUBLICA).size() + " solicitação(ões)");
        System.out.println("   Filtro por status \"" + StatusSolicitacao.RECEBIDA.getDescricao() + "\": "
                + service.filtrarPorStatus(StatusSolicitacao.RECEBIDA).size() + " solicitação(ões)");

        // 8. Atualização de status pelo atendente
        titulo("8. Atendente atualizando " + doCidadao.getProtocolo() + " para "
                + formatarStatus(StatusSolicitacao.EM_ANALISE) + "...");
        Solicitacao atualizada = service.atualizarStatus(
                atendente,
                doCidadao.getProtocolo(),
                StatusSolicitacao.EM_ANALISE,
                "Solicitação encaminhada para análise da equipe responsável.");
        System.out.println("   Status atual:     " + formatarStatus(atualizada.getStatusAtual()));

        // 9. Histórico
        titulo("9. Histórico de " + atualizada.getProtocolo());
        int numero = 1;
        for (HistoricoStatus evento : atualizada.getHistorico()) {
            System.out.println("   " + numero + ". " + evento.getDataHora().format(FORMATO_DATA_HORA)
                    + " | " + formatarStatus(evento.getStatus()));
            System.out.println("      Observação: "
                    + (evento.possuiObservacao() ? evento.getObservacao() : "(sem observação)"));
            numero++;
        }

        // 10. Situações de erro tratadas
        titulo("10. Tratando situações inválidas...");
        try {
            authService.autenticar("admin@cidadeemdia.gov.br", "senha-errada");
        } catch (IllegalArgumentException e) {
            System.out.println("   Login inválido:        " + e.getMessage());
        }
        try {
            service.buscarPorProtocolo("HGV-2000-99999");
        } catch (NoSuchElementException e) {
            System.out.println("   Protocolo inexistente: " + e.getMessage());
        }
        try {
            service.atualizarStatus(cidadao, anonima.getProtocolo(), StatusSolicitacao.RESOLVIDA, null);
        } catch (SecurityException e) {
            System.out.println("   Acesso negado:         " + e.getMessage());
        }

        System.out.println();
        System.out.println(LINHA);
        System.out.println("Demonstração concluída.");
        System.out.println(LINHA);
    }

    private static void titulo(String texto) {
        System.out.println();
        System.out.println(SEPARADOR);
        System.out.println(texto);
    }

    private static void exibirUsuario(Usuario usuario) {
        System.out.println("   Nome:             " + usuario.getNome());
        System.out.println("   E-mail:           " + usuario.getEmail());
        System.out.println("   Perfil:           " + usuario.getPerfil().getDescricao());
    }

    private static void exibirSolicitacao(Solicitacao solicitacao) {
        System.out.println("   Protocolo gerado: " + solicitacao.getProtocolo());
        System.out.println("   Categoria:        " + solicitacao.getCategoria().getDescricao());
        System.out.println("   Status inicial:   " + formatarStatus(solicitacao.getStatusAtual()));
        System.out.println("   Solicitante:      " + (solicitacao.isAnonima()
                ? "Anônimo"
                : solicitacao.getNome() + " <" + solicitacao.getEmail() + ">"));
        Anexo anexo = solicitacao.getAnexo();
        System.out.println("   Foto:             " + (anexo == null
                ? "(sem foto)"
                : anexo.getNomeArquivo() + " (" + anexo.getTipoArquivo() + ", "
                        + String.format(PT_BR, "%.1f MiB", anexo.getTamanhoBytes() / (1024.0 * 1024)) + ")"));
    }

    private static String formatarStatus(StatusSolicitacao status) {
        return status.getDescricao() + " (" + status.name() + ")";
    }
}
