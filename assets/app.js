/*
 * Desafio 12x12 — renderiza a vitrine a partir de projects.json.
 * Todo texto vindo do JSON entra no DOM via textContent (nunca innerHTML).
 *
 * Dica de teste: ?hoje=AAAA-MM-DD na URL simula a data atual.
 */
(() => {
  "use strict";

  const DIA_MS = 24 * 60 * 60 * 1000;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const STATUS = {
    lancado: { rotulo: "Lançado", icone: "check" },
    em_andamento: { rotulo: "Em andamento", icone: "relogio" },
    em_breve: { rotulo: "Em breve", icone: "foguete" },
    a_definir: { rotulo: "A definir", icone: null },
  };

  // Ícones de traço (viewBox 24x24). Strings fixas, nunca dados do JSON.
  const ICONES = {
    check: ["M5 12.5l4.5 4.5L19 7.5"],
    relogio: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M12 7.5V12l3 2"],
    foguete: [
      "M9 15l-3-3c1.2-4.6 5.4-9 12.5-9.5C18 9.6 13.6 13.8 9 15z",
      "M6 12l-2.5-.5L6 8.5h3.5",
      "M12 18l.5 2.5 3-2.5v-3.5",
      "M5.5 15.5C4 17 4 20 4 20s3 0 4.5-1.5",
    ],
    externo: ["M14 4h6v6", "M20 4l-9 9", "M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"],
  };
  // Marca do GitHub (viewBox 16x16, preenchida).
  const GITHUB_PATH =
    "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

  const fmtPct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const $ = (id) => document.getElementById(id);

  /* ---------- Utilidades ---------- */

  function el(tag, attrs = {}, ...filhos) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v === true ? "" : String(v));
    }
    for (const f of filhos) if (f) node.append(f);
    return node;
  }

  function icone(nome) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "icone");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (nome === "github") {
      svg.setAttribute("viewBox", "0 0 16 16");
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", GITHUB_PATH);
      p.setAttribute("fill", "currentColor");
      svg.append(p);
      return svg;
    }
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    for (const d of ICONES[nome]) {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      svg.append(p);
    }
    return svg;
  }

  const doisDigitos = (n) => String(n).padStart(2, "0");

  /** "AAAA-MM-DD" -> Date local à meia-noite (evita deslocamento de fuso). */
  function lerData(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const fmtData = (d) => `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
  const fmtDiaMes = (d) => `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`;

  function hoje() {
    const simulada = lerData(new URLSearchParams(location.search).get("hoje"));
    if (simulada) return simulada;
    const agora = new Date();
    return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  }

  const urlSegura = (u) => (typeof u === "string" && /^https:\/\//i.test(u) ? u : null);

  /* ---------- Cálculos ---------- */

  function calcular(dados) {
    const total = dados.desafio.total_semanas;
    const projetos = [...dados.projetos].sort((a, b) => a.semana - b.semana);
    const porSemana = new Map(projetos.map((p) => [p.semana, p]));
    const lancados = projetos.filter((p) => p.status === "lancado").length;
    const progresso = (lancados / total) * 100;

    const inicio = lerData(dados.desafio.inicio);
    const dias = inicio ? Math.round((hoje() - inicio) / DIA_MS) : 0;
    const antesDoInicio = dias < 0;
    const semanaAtual = antesDoInicio ? null : Math.min(Math.max(Math.floor(dias / 7) + 1, 1), total);

    const semanas = Array.from({ length: total }, (_, i) => porSemana.get(i + 1) || { semana: i + 1, status: "a_definir" });

    return { total, lancados, progresso, inicio, antesDoInicio, semanaAtual, semanas };
  }

  /* ---------- Renderização ---------- */

  function renderCabecalho(dados, c) {
    const lancTexto = `${c.lancados} de ${c.total} lançados`;
    $("selo-texto").textContent = c.antesDoInicio
      ? `Começa em ${fmtDiaMes(c.inicio)} • ${lancTexto}`
      : `Semana ${doisDigitos(c.semanaAtual)} • ${lancTexto}`;

    $("stat-semanas").textContent = String(c.total);
    $("stat-lancados").textContent = String(c.lancados);
    $("stat-progresso").textContent = `${fmtPct.format(c.progresso)}%`;
    $("stat-licenca").textContent = dados.desafio.licenca;

    const gh = `https://github.com/${encodeURIComponent(dados.autor.github)}`;
    $("link-github-topo").href = gh;
  }

  function renderTrilha(c) {
    const barra = $("barra-progresso");
    barra.setAttribute("aria-valuemax", String(c.total));
    barra.setAttribute("aria-valuenow", String(c.lancados));
    barra.setAttribute("aria-valuetext", `${c.lancados} de ${c.total} projetos lançados`);

    const trilha = $("trilha");
    trilha.replaceChildren();

    for (const s of c.semanas) {
      const atual = s.semana === c.semanaAtual;
      const classes = ["marco", `marco--${s.status}`, atual && "marco--atual"].filter(Boolean).join(" ");
      trilha.append(
        el(
          "li",
          { class: classes, title: `Semana ${s.semana}: ${STATUS[s.status].rotulo}` },
          el("span", { class: "marco__barra" }),
          el("span", { class: "marco__num", text: doisDigitos(s.semana) })
        )
      );
    }

    $("progresso-legenda").textContent = c.antesDoInicio
      ? `Início em ${fmtData(c.inicio)}`
      : `Semana atual: ${doisDigitos(c.semanaAtual)} de ${c.total}`;
  }

  function botao(texto, url, nomeIcone, primario, nomeProjeto) {
    const seguro = urlSegura(url);
    if (!seguro) {
      return el(
        "span",
        { class: "botao", "aria-disabled": "true", title: "Disponível no lançamento" },
        icone(nomeIcone),
        document.createTextNode(texto)
      );
    }
    return el(
      "a",
      {
        class: primario ? "botao botao--primario" : "botao",
        href: seguro,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": `${texto}: ${nomeProjeto} (abre em nova aba)`,
      },
      icone(nomeIcone),
      document.createTextNode(texto)
    );
  }

  function card(s, indice) {
    const definido = s.status !== "a_definir";
    const info = STATUS[s.status];

    const status = el("span", { class: `status status--${s.status}` });
    if (info.icone) status.append(icone(info.icone));
    status.append(document.createTextNode(info.rotulo));

    const topo = el("div", { class: "card__topo" }, el("span", { class: "card__semana", text: `SEMANA ${doisDigitos(s.semana)}` }), status);

    const dataLanc = lerData(s.lancamento);
    if (dataLanc) {
      topo.append(el("time", { class: "card__data", datetime: s.lancamento, text: fmtData(dataLanc) }));
    }

    const corpo = el(
      "div",
      {},
      el("h3", { text: definido ? s.nome : "A definir" }),
      el("p", { class: "card__subtitulo", text: definido ? s.subtitulo : "Projeto ainda não anunciado" })
    );

    const art = el("article", { class: `card card--${s.status}`, style: `--i:${indice}` }, topo, corpo);

    if (definido) {
      art.append(el("p", { class: "card__descricao", text: s.descricao }));
      if (Array.isArray(s.stack) && s.stack.length) {
        const ul = el("ul", { class: "stack", "aria-label": "Tecnologias" });
        for (const t of s.stack) ul.append(el("li", { text: t }));
        art.append(ul);
      }
      art.append(
        el(
          "div",
          { class: "card__acoes" },
          botao("Ver demo", s.demo, "externo", true, s.nome),
          botao("Código", s.repo, "github", false, s.nome)
        )
      );
    } else {
      art.append(el("p", { class: "card__descricao", text: "O projeto desta semana será revelado quando chegar a hora." }));
    }
    return art;
  }

  function renderGrade(c) {
    $("grade").replaceChildren(...c.semanas.map(card));
  }

  function renderRodape(dados) {
    $("autor-nome").textContent = dados.autor.nome;
    const lista = $("rodape-links");
    const links = [["GitHub", `https://github.com/${encodeURIComponent(dados.autor.github)}`]];
    const linkedin = urlSegura(dados.autor.linkedin);
    if (linkedin) links.push(["LinkedIn", linkedin]);
    lista.replaceChildren(
      ...links.map(([nome, url]) =>
        el("li", {}, el("a", { href: url, target: "_blank", rel: "noopener noreferrer", text: nome }))
      )
    );
  }

  function renderErro(detalhe) {
    $("selo-texto").textContent = "Não foi possível carregar os dados";
    const aviso = el(
      "div",
      { class: "aviso", role: "alert" },
      el("strong", { text: "Ops! Os projetos não carregaram." }),
      el("p", {
        text: "Tente recarregar a página em alguns instantes. Se estiver rodando localmente, use um servidor (python -m http.server 8000) em vez de abrir o arquivo direto.",
      })
    );
    $("grade").replaceChildren(aviso);
    console.error("[12x12] Falha ao carregar ou renderizar a vitrine:", detalhe);
  }

  async function iniciar() {
    try {
      const resp = await fetch("./projects.json", { cache: "no-cache" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const dados = await resp.json();
      if (!dados?.desafio?.total_semanas || !Array.isArray(dados.projetos)) throw new Error("Estrutura inesperada");

      const c = calcular(dados);
      renderCabecalho(dados, c);
      renderTrilha(c);
      renderGrade(c);
      renderRodape(dados);
    } catch (erro) {
      renderErro(erro);
    }
  }

  iniciar();
})();
