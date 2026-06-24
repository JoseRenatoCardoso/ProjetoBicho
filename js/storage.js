/**
 * ============================================================
 * storage.js — Módulo de gerenciamento de dados (Local Storage)
 * Projeto Bicho · ONG de proteção animal
 * ============================================================
 *
 * Responsável por cadastrar, listar, excluir e pesquisar
 * usuários, persistindo tudo no Local Storage do navegador.
 *
 * Segurança: segue diretrizes OWASP — sanitização de entradas,
 * validação rigorosa, ausência de innerHTML/eval/document.write.
 *
 * Dependências externas: NENHUMA (vanilla JS puro).
 * ============================================================
 */

'use strict';

/** Chave única usada no Local Storage para armazenar os usuários */
var STORAGE_KEY = 'usuarios';

// ─────────────────────────────────────────────────────────────
// FUNÇÕES DE SEGURANÇA (OWASP)
// ─────────────────────────────────────────────────────────────

/**
 * Sanitiza uma string de entrada removendo qualquer tag HTML,
 * normalizando espaços múltiplos e aplicando trim.
 *
 * @param {string} str — Valor bruto informado pelo usuário
 * @returns {string} — Valor limpo e seguro para uso
 */
function sanitizarInput(str) {
  // Garante que o parâmetro seja uma string
  if (typeof str !== 'string') {
    return '';
  }

  var limpo = str;

  // Remove qualquer tag HTML/XML para prevenir XSS
  limpo = limpo.replace(/<[^>]*>/g, '');

  // Normaliza múltiplos espaços em branco para um único espaço
  limpo = limpo.replace(/\s+/g, ' ');

  // Remove espaços nas extremidades
  limpo = limpo.trim();

  return limpo;
}

/**
 * Valida o nome do usuário conforme regras de segurança.
 * - Mínimo 2 caracteres, máximo 100
 * - Não pode conter caracteres potencialmente perigosos
 *
 * @param {string} nome — Nome já sanitizado
 * @returns {{ valido: boolean, erro?: string }}
 */
function validarNome(nome) {
  if (typeof nome !== 'string') {
    return { valido: false, erro: 'O nome deve ser um texto válido.' };
  }

  if (nome.length < 2) {
    return { valido: false, erro: 'O nome deve ter pelo menos 2 caracteres.' };
  }

  if (nome.length > 100) {
    return { valido: false, erro: 'O nome não pode ultrapassar 100 caracteres.' };
  }

  // Permitir apenas letras, espaços e caracteres acentuados comuns.
  // Isso bloqueia símbolos como @ e previne injeção HTML/XSS.
  var regexLetras = /^[a-zA-ZÀ-ÿ\s]+$/;
  if (!regexLetras.test(nome)) {
    return {
      valido: false,
      erro: 'O nome deve conter apenas letras e espaços.'
    };
  }

  return { valido: true };
}

/**
 * Valida o e-mail do usuário com regex RFC 5322 simplificada.
 * - Máximo 254 caracteres (limite prático de endereços de e-mail)
 *
 * @param {string} email — E-mail já sanitizado
 * @returns {{ valido: boolean, erro?: string }}
 */
function validarEmail(email) {
  if (typeof email !== 'string') {
    return { valido: false, erro: 'O e-mail deve ser um texto válido.' };
  }

  if (email.length === 0) {
    return { valido: false, erro: 'O e-mail é obrigatório.' };
  }

  if (email.length > 254) {
    return { valido: false, erro: 'O e-mail não pode ultrapassar 254 caracteres.' };
  }

  // Regex RFC 5322 simplificada — cobre a grande maioria dos endereços válidos
  var regexEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!regexEmail.test(email)) {
    return { valido: false, erro: 'Formato de e-mail inválido.' };
  }

  return { valido: true };
}

// ─────────────────────────────────────────────────────────────
// FUNÇÕES DE FORMATAÇÃO
// ─────────────────────────────────────────────────────────────

/**
 * Converte uma string ISO 8601 para o formato brasileiro dd/mm/aaaa hh:mm.
 * Usa padStart para garantir dois dígitos em dia, mês, hora e minuto.
 *
 * @param {string} isoString — Data no formato ISO (ex.: 2026-06-23T21:50:00.000Z)
 * @returns {string} — Data formatada (ex.: 23/06/2026 21:50)
 */
function formatarData(isoString) {
  if (typeof isoString !== 'string') {
    return '';
  }

  var data = new Date(isoString);

  // Verifica se a data gerada é válida
  if (isNaN(data.getTime())) {
    return '';
  }

  var dia = String(data.getDate()).padStart(2, '0');
  var mes = String(data.getMonth() + 1).padStart(2, '0');
  var ano = data.getFullYear();
  var hora = String(data.getHours()).padStart(2, '0');
  var minuto = String(data.getMinutes()).padStart(2, '0');

  return dia + '/' + mes + '/' + ano + ' ' + hora + ':' + minuto;
}

// ─────────────────────────────────────────────────────────────
// FUNÇÕES DE ACESSO AO LOCAL STORAGE
// ─────────────────────────────────────────────────────────────

/**
 * Recupera o array de usuários armazenado no Local Storage.
 * Usa try/catch para lidar com JSON corrompido de forma segura.
 *
 * @returns {Array<Object>} — Lista de usuários ou array vazio
 */
function getUsuarios() {
  try {
    var dados = localStorage.getItem(STORAGE_KEY);

    // Se a chave não existir, retorna array vazio
    if (dados === null) {
      return [];
    }

    var resultado = JSON.parse(dados);

    // Garante que o valor parseado seja de fato um array
    if (!Array.isArray(resultado)) {
      return [];
    }

    return resultado;
  } catch (erro) {
    // JSON inválido ou qualquer falha no parse — retorna seguro
    return [];
  }
}

/**
 * Persiste o array de usuários no Local Storage como JSON.
 *
 * @param {Array<Object>} usuarios — Array de objetos de usuário
 */
function salvarUsuarios(usuarios) {
  // Validação defensiva: garante que sempre salvamos um array
  if (!Array.isArray(usuarios)) {
    usuarios = [];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

// ─────────────────────────────────────────────────────────────
// FUNÇÕES CRUD
// ─────────────────────────────────────────────────────────────

/**
 * Cadastra um novo usuário após sanitização e validação completa.
 * Gera um ID único via crypto.randomUUID() e registra a data atual.
 *
 * @param {string} nome  — Nome informado pelo usuário
 * @param {string} email — E-mail informado pelo usuário
 * @returns {{ sucesso: boolean, usuario?: Object, erro?: string }}
 */
function adicionarUsuario(nome, email) {
  // Sanitiza as entradas antes de qualquer validação
  var nomeLimpo = sanitizarInput(nome);
  var emailLimpo = sanitizarInput(email);

  // Valida o nome
  var resultadoNome = validarNome(nomeLimpo);
  if (!resultadoNome.valido) {
    return { sucesso: false, erro: resultadoNome.erro };
  }

  // Valida o e-mail
  var resultadoEmail = validarEmail(emailLimpo);
  if (!resultadoEmail.valido) {
    return { sucesso: false, erro: resultadoEmail.erro };
  }

  // Monta o objeto do novo usuário
  var novoUsuario = {
    id: crypto.randomUUID(),
    nome: nomeLimpo,
    email: emailLimpo,
    dataCadastro: new Date().toISOString()
  };

  // Recupera lista atual, adiciona e persiste
  var usuarios = getUsuarios();
  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);

  return { sucesso: true, usuario: novoUsuario };
}

/**
 * Remove um usuário específico pelo seu ID único.
 *
 * @param {string} id — UUID do usuário a ser removido
 * @returns {boolean} — true se encontrou e removeu, false caso contrário
 */
function excluirUsuario(id) {
  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }

  var usuarios = getUsuarios();
  var tamanhoOriginal = usuarios.length;

  // Filtra mantendo apenas os que NÃO correspondem ao ID informado
  var atualizados = usuarios.filter(function (usuario) {
    return usuario.id !== id;
  });

  // Se o tamanho não mudou, o ID não foi encontrado
  if (atualizados.length === tamanhoOriginal) {
    return false;
  }

  salvarUsuarios(atualizados);
  return true;
}

/**
 * Remove todos os usuários, esvaziando a lista no Local Storage.
 *
 * @returns {boolean} — Sempre retorna true
 */
function excluirTodosUsuarios() {
  salvarUsuarios([]);
  return true;
}

/**
 * Pesquisa usuários cujo nome contenha o termo informado.
 * A busca é parcial (substring) e case-insensitive.
 *
 * @param {string} termo — Texto de busca
 * @returns {Array<Object>} — Usuários que correspondem à pesquisa
 */
function pesquisarPorNome(termo) {
  var termoLimpo = sanitizarInput(termo);

  // Se o termo estiver vazio após sanitização, retorna todos
  if (termoLimpo.length === 0) {
    return getUsuarios();
  }

  var termoMinusculo = termoLimpo.toLowerCase();

  return getUsuarios().filter(function (usuario) {
    // Proteção contra objetos sem propriedade 'nome'
    if (typeof usuario.nome !== 'string') {
      return false;
    }
    return usuario.nome.toLowerCase().includes(termoMinusculo);
  });
}
