package br.com.cidadeemdia;

import java.util.Locale;
import java.util.Set;

/**
 * Metadados da foto opcional de uma solicitação.
 *
 * Os bytes do arquivo não são armazenados; as regras seguem as do site:
 * JPEG, PNG ou WebP, não vazio e com até 5 MiB.
 */
public class Anexo {
    public static final long TAMANHO_MAXIMO_BYTES = 5L * 1024 * 1024;
    private static final Set<String> TIPOS_PERMITIDOS = Set.of("image/jpeg", "image/png", "image/webp");

    private final String nomeArquivo;
    private final String tipoArquivo;
    private final long tamanhoBytes;

    /**
     * @param tipoArquivo tipo MIME, por exemplo "image/png"
     */
    public Anexo(String nomeArquivo, String tipoArquivo, long tamanhoBytes) {
        if (nomeArquivo == null || nomeArquivo.isBlank()) {
            throw new IllegalArgumentException("O nome do arquivo é obrigatório.");
        }
        String tipo = tipoArquivo == null ? "" : tipoArquivo.trim().toLowerCase(Locale.ROOT);
        if (!TIPOS_PERMITIDOS.contains(tipo)) {
            throw new IllegalArgumentException("Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.");
        }
        if (tamanhoBytes <= 0) {
            throw new IllegalArgumentException("O arquivo está vazio.");
        }
        if (tamanhoBytes > TAMANHO_MAXIMO_BYTES) {
            throw new IllegalArgumentException("O arquivo excede o limite de 5 MiB.");
        }
        this.nomeArquivo = nomeArquivo.trim();
        this.tipoArquivo = tipo;
        this.tamanhoBytes = tamanhoBytes;
    }

    public String getNomeArquivo() {
        return nomeArquivo;
    }

    public String getTipoArquivo() {
        return tipoArquivo;
    }

    public long getTamanhoBytes() {
        return tamanhoBytes;
    }
}
