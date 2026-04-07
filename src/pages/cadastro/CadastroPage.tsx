import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
} from "react";
import RainbowBorder from "../../components/rainbow-border/RainbowBorder";
import logoHomeModel from "../../components/navigate-bar/logo-mode-models.jpg";
import "./CadastroPage.css";

type CadastroForm = {
  nomeCompleto: string;
  email: string;
  confirmarEmail: string;
  senha: string;
  confirmarSenha: string;
  rg: string;
  cpf: string;
  maiorDeIdade: boolean;
  nomeResponsavel: string;
  cpfResponsavel: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  foto: File | null;
  dataAvaliacao: string;
  horarioAvaliacao: string;
};

const INITIAL_FORM: CadastroForm = {
  nomeCompleto: "",
  email: "",
  confirmarEmail: "",
  senha: "",
  confirmarSenha: "",
  rg: "",
  cpf: "",
  maiorDeIdade: true,
  nomeResponsavel: "",
  cpfResponsavel: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  pais: "Brasil",
  foto: null,
  dataAvaliacao: "",
  horarioAvaliacao: "",
};

function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskRg(value: string): string {
  const d = onlyDigits(value).slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
}

function maskCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function maskEmail(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

async function fetchAddressByCep(cep: string) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const endpoints = [
    `https://brasilapi.com.br/api/cep/v2/${digits}`,
    `https://viacep.com.br/ws/${digits}/json/`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.erro) continue;
      return {
        rua: data.street ?? data.logradouro ?? "",
        bairro: data.neighborhood ?? data.bairro ?? "",
        cidade: data.city ?? data.localidade ?? "",
        estado: data.state ?? data.uf ?? "",
        pais: "Brasil",
      };
    } catch {
      // Tenta próximo provedor.
    }
  }

  return null;
}

export default function CadastroPage() {
  const [form, setForm] = useState<CadastroForm>(INITIAL_FORM);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const brandFont = useMemo(
    () =>
      '"Montserrat", "Avenir Next", "Nunito Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    [],
  );

  const onField =
    (key: keyof CadastroForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setSubmitMessage("");

      setForm((prev) => {
        if (key === "cpf" || key === "cpfResponsavel") {
          return { ...prev, [key]: maskCpf(value) };
        }
        if (key === "rg") {
          return { ...prev, [key]: maskRg(value) };
        }
        if (key === "cep") {
          return { ...prev, [key]: maskCep(value) };
        }
        if (key === "email" || key === "confirmarEmail") {
          return { ...prev, [key]: maskEmail(value) };
        }
        return { ...prev, [key]: value };
      });
    };

  const onToggleMaiorDeIdade = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      maiorDeIdade: checked,
      nomeResponsavel: checked ? "" : prev.nomeResponsavel,
      cpfResponsavel: checked ? "" : prev.cpfResponsavel,
    }));
  };

  const onPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, foto: file }));
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (!file) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const onCepBlur = async () => {
    setCepMessage("");
    const digits = onlyDigits(form.cep);
    if (digits.length !== 8) return;

    setCepLoading(true);
    const address = await fetchAddressByCep(digits);
    setCepLoading(false);

    if (!address) {
      setCepMessage("Não foi possível localizar o CEP. Preencha os campos manualmente.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      rua: address.rua || prev.rua,
      bairro: address.bairro || prev.bairro,
      cidade: address.cidade || prev.cidade,
      estado: address.estado || prev.estado,
      pais: address.pais || prev.pais,
    }));
    setCepMessage("Endereço preenchido automaticamente.");
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.email !== form.confirmarEmail) {
      setSubmitMessage("Os e-mails não coincidem. Verifique e tente novamente.");
      return;
    }
    if (form.senha !== form.confirmarSenha) {
      setSubmitMessage("As senhas não coincidem. Verifique e tente novamente.");
      return;
    }
    setSubmitMessage("Cadastro enviado com sucesso! Em breve nossa equipe entrará em contato.");
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  return (
    <main
      className="cadastro-page min-h-dvh w-full pb-28 pt-28 sm:pb-24"
      style={
        {
          "--cad-bg-image": `url(${logoHomeModel})`,
          "--cad-brand-font": brandFont,
        } as CSSProperties
      }
    >
      <section className="cadastro-shell mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="cadastro-card">
          <header className="cadastro-header">
            <p className="cadastro-impact">Está pronto para dar início ao seu sonho?</p>
            <h1 className="cadastro-title">Cadastro Home Model</h1>
          </header>

          <form className="cadastro-form" onSubmit={onSubmit}>
            <div className="cadastro-grid">
              <label className="cad-field">
                <span>Nome completo</span>
                <input required value={form.nomeCompleto} onChange={onField("nomeCompleto")} />
              </label>

              <label className="cad-field">
                <span>E-mail</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={onField("email")}
                  autoComplete="email"
                  placeholder="nome@dominio.com"
                />
              </label>

              <label className="cad-field">
                <span>Confirmar e-mail</span>
                <input
                  type="email"
                  required
                  value={form.confirmarEmail}
                  onChange={onField("confirmarEmail")}
                  autoComplete="email"
                  placeholder="nome@dominio.com"
                />
              </label>

              <label className="cad-field">
                <span>RG</span>
                <input required value={form.rg} onChange={onField("rg")} />
              </label>

              <label className="cad-field">
                <span>CPF</span>
                <input
                  required
                  value={form.cpf}
                  onChange={onField("cpf")}
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                />
              </label>

              <label className="cad-check">
                <input
                  type="checkbox"
                  checked={form.maiorDeIdade}
                  onChange={onToggleMaiorDeIdade}
                />
                <span>Sou maior de 18 anos</span>
              </label>
            </div>

            {!form.maiorDeIdade ? (
              <div className="cadastro-grid">
                <label className="cad-field">
                    <span>Nome do responsável</span>
                  <input
                    required={!form.maiorDeIdade}
                    value={form.nomeResponsavel}
                    onChange={onField("nomeResponsavel")}
                  />
                </label>

                <label className="cad-field">
                    <span>CPF do responsável</span>
                  <input
                    required={!form.maiorDeIdade}
                    value={form.cpfResponsavel}
                    onChange={onField("cpfResponsavel")}
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="000.000.000-00"
                  />
                </label>
              </div>
            ) : null}

            <div className="cad-divider" />

            <div className="cadastro-grid">
              <label className="cad-field">
                <span>CEP</span>
                <input
                  required
                  value={form.cep}
                  onChange={onField("cep")}
                  onBlur={onCepBlur}
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  autoComplete="postal-code"
                />
              </label>

              <label className="cad-field">
                <span>Rua</span>
                <input required value={form.rua} onChange={onField("rua")} />
              </label>

              <label className="cad-field">
                <span>Número</span>
                <input required value={form.numero} onChange={onField("numero")} />
              </label>

              <label className="cad-field">
                <span>Complemento</span>
                <input value={form.complemento} onChange={onField("complemento")} />
              </label>

              <label className="cad-field">
                <span>Bairro</span>
                <input required value={form.bairro} onChange={onField("bairro")} />
              </label>

              <label className="cad-field">
                <span>Cidade</span>
                <input required value={form.cidade} onChange={onField("cidade")} />
              </label>

              <label className="cad-field">
                <span>Estado</span>
                <input required value={form.estado} onChange={onField("estado")} />
              </label>

              <label className="cad-field">
                <span>País</span>
                <input required value={form.pais} onChange={onField("pais")} />
              </label>
            </div>

            {cepLoading || cepMessage ? (
              <p className="cad-helper">{cepLoading ? "Buscando CEP..." : cepMessage}</p>
            ) : null}

            <div className="cad-divider" />

            <div className="cadastro-grid">
              <div className="cad-field cad-upload-field">
                <span>Upload de foto</span>
                <div className="cad-upload-box">
                  <input
                    id="cadastro-foto"
                    type="file"
                    accept="image/*"
                    onChange={onPhotoUpload}
                    className="cad-upload-input-hidden"
                  />
                  <label htmlFor="cadastro-foto" className="cad-upload-trigger-wrap">
                    <RainbowBorder className="cad-upload-trigger text-sm font-semibold leading-none text-zinc-900">
                      Selecionar foto
                    </RainbowBorder>
                  </label>
                  <p className="cad-upload-filename">
                    {form.foto ? form.foto.name : "Nenhum arquivo selecionado"}
                  </p>
                  <p className="cad-upload-hint">
                    Envie uma foto nítida (JPG ou PNG).
                  </p>
                </div>
              </div>

              <label className="cad-field">
                <span>Data para avaliação</span>
                <input
                  type="date"
                  required
                  value={form.dataAvaliacao}
                  onChange={onField("dataAvaliacao")}
                />
              </label>

              <label className="cad-field">
                <span>Horário para avaliação</span>
                <input
                  type="time"
                  required
                  value={form.horarioAvaliacao}
                  onChange={onField("horarioAvaliacao")}
                />
              </label>
            </div>

            {photoPreview ? (
              <div className="cad-photo-preview-wrap">
                <img src={photoPreview} alt="Preview do upload" className="cad-photo-preview" />
              </div>
            ) : null}

            <div className="cad-password-stack">
              <label className="cad-field">
                <span>Criar senha</span>
                <input
                  type="password"
                  required
                  value={form.senha}
                  onChange={onField("senha")}
                  autoComplete="new-password"
                />
              </label>

              <label className="cad-field">
                <span>Confirmar senha</span>
                <input
                  type="password"
                  required
                  value={form.confirmarSenha}
                  onChange={onField("confirmarSenha")}
                  autoComplete="new-password"
                />
              </label>
            </div>

            <div className="cad-submit">
              <button type="submit" className="inline-flex cursor-pointer border-0 bg-transparent p-0">
                <RainbowBorder className="px-7 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-900">
                  Enviar
                </RainbowBorder>
              </button>
            </div>

            {submitMessage ? <p className="cad-success">{submitMessage}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
