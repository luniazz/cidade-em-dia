package br.com.cidadeemdia;

import java.util.List;
import java.util.Locale;

/**
 * Autenticação local e demonstrativa, equivalente à do site.
 *
 * As senhas ficam em texto puro apenas nesta classe e nunca são expostas pelo
 * {@link Usuario}. Não há criptografia, token nem sessão: é somente uma
 * demonstração, a ser substituída por uma autenticação real no futuro.
 */
public class AuthService {
    /** Usuário de demonstração com a respectiva senha, visível só aqui. */
    private record Conta(Usuario usuario, String senha) {
    }

    private final List<Conta> contas = List.of(
            new Conta(new Usuario("demo-cidadao", "João da Silva",
                    "cidadao@cidadeemdia.com.br", PerfilUsuario.CIDADAO), "cidadao123"),
            new Conta(new Usuario("demo-atendente", "Administrador",
                    "admin@cidadeemdia.gov.br", PerfilUsuario.ATENDENTE), "admin123"));

    /**
     * @return o usuário correspondente às credenciais
     * @throws IllegalArgumentException quando o e-mail ou a senha são inválidos
     */
    public Usuario autenticar(String email, String senha) {
        String emailTratado = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        for (Conta conta : contas) {
            if (conta.usuario().getEmail().equalsIgnoreCase(emailTratado) && conta.senha().equals(senha)) {
                return conta.usuario();
            }
        }
        throw new IllegalArgumentException("E-mail ou senha inválidos.");
    }
}
