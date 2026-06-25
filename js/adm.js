'use strict';

/** @type {HTMLFormElement}   */ var formulario;
/** @type {HTMLInputElement}  */ var inputNome;
/** @type {HTMLInputElement}  */ var inputEmail;
/** @type {HTMLButtonElement} */ var btnLimpar;
/** @type {HTMLInputElement}  */ var campoPesquisa;
/** @type {HTMLButtonElement} */ var btnExcluirTodos;
/** @type {HTMLUListElement}  */ var listaUsuarios;
/** @type {HTMLParagraphElement} */ var listaVazia;


/**
 * Cria uma versão "debounced" de uma função: a execução real
 * só ocorre após o período de espera transcorrer sem que a
 * função seja invocada novamente.
 *
 * @param {Function} func
 * @param {number}   espera
 * @returns {Function}
 */
function debounce(func, espera) {
  var temporizador = null;

  return function () {
    var contexto = this;
    var argumentos = arguments;

    clearTimeout(temporizador);

    temporizador = setTimeout(function () {
      func.apply(contexto, argumentos);
    }, espera);
  };
}


// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DA LISTA DE USUÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza a lista completa de usuários na tela.
 * Se nenhum array for fornecido, busca do Local Storage.
 *
 * Cada `<li>` é construído inteiramente via DOM API:
 *   <li data-id="uuid">
 *     <div class="lista-item-dados">
 *       <span class="lista-item-data">dd/mm/aaaa hh:mm</span>
 *       <span class="lista-item-nome">Nome</span>
 *       <span class="lista-item-email">email@x.com</span>
 *     </div>
 *     <button class="btn-excluir-item" ...>✕</button>
 *   </li>
 *
 * @param {Array<Object>} [usuarios] — Lista de usuários (opcional)
 */
function renderizarLista(usuarios) {
  // Se não recebeu array, busca todos do storage
  if (typeof usuarios === 'undefined') {
    usuarios = getUsuarios();
  }

  // Limpa a <ul> removendo todos os filhos existentes
  while (listaUsuarios.firstChild) {
    listaUsuarios.removeChild(listaUsuarios.firstChild);
  }

  // Estado vazio: mostra mensagem, esconde lista
  if (usuarios.length === 0) {
    listaVazia.style.display = '';
    listaUsuarios.style.display = 'none';
    return;
  }

  // Há itens: esconde mensagem de vazio, mostra lista
  listaVazia.style.display = 'none';
  listaUsuarios.style.display = '';

  // Constrói cada item da lista
  for (var i = 0; i < usuarios.length; i++) {
    var usuario = usuarios[i];

    var li = document.createElement('li');
    li.setAttribute('data-id', usuario.id);

    var divDados = document.createElement('div');
    divDados.classList.add('lista-item-dados');

    var spanData = document.createElement('span');
    spanData.classList.add('lista-item-data');
    spanData.textContent = formatarData(usuario.dataCadastro);

    var spanNome = document.createElement('span');
    spanNome.classList.add('lista-item-nome');
    spanNome.textContent = usuario.nome;

    var spanEmail = document.createElement('span');
    spanEmail.classList.add('lista-item-email');
    spanEmail.textContent = usuario.email;

    divDados.appendChild(spanData);
    divDados.appendChild(spanNome);
    divDados.appendChild(spanEmail);

    var btnExcluir = document.createElement('button');
    btnExcluir.classList.add('btn-excluir-item');
    btnExcluir.type = 'button';
    btnExcluir.title = 'Excluir usuário';
    btnExcluir.setAttribute('aria-label', 'Excluir ' + usuario.nome);
    btnExcluir.textContent = '✕';
    (function (id, nome) {
      btnExcluir.addEventListener('click', function () {
        confirmarExcluirItem(id, nome);
      });
    })(usuario.id, usuario.nome);

    li.appendChild(divDados);
    li.appendChild(btnExcluir);

    listaUsuarios.appendChild(li);
    animarEntrada(li);
  }
}


// ─────────────────────────────────────────────────────────────
// CADASTRO DE USUÁRIO
// ─────────────────────────────────────────────────────────────

/**
 * Manipula o envio do formulário de cadastro.
 * Delega validação/sanitização ao storage.js e trata o retorno.
 *
 * @param {Event} event — Evento de submit do formulário
 */
function cadastrarUsuario(event) {
  event.preventDefault();

  var nome = inputNome.value;
  var email = inputEmail.value;

  // Delega ao storage.js (sanitiza + valida + persiste)
  var resultado = adicionarUsuario(nome, email);

  if (!resultado.sucesso) {
    mostrarNotificacao(resultado.erro, 'erro');
    return;
  }

  // Sucesso: re-renderiza, limpa formulário, foca no nome
  renderizarLista();
  formulario.reset();
  inputNome.focus();
  mostrarNotificacao('Usuário cadastrado com sucesso!', 'sucesso');

  // Limpa pesquisa ativa para mostrar lista completa
  if (campoPesquisa.value.length > 0) {
    campoPesquisa.value = '';
  }
}


// ─────────────────────────────────────────────────────────────
// EXCLUSÃO INDIVIDUAL COM CONFIRMAÇÃO
// ─────────────────────────────────────────────────────────────

/**
 * Solicita confirmação via modal antes de excluir um usuário.
 * Anima a saída do <li> e só então remove do storage.
 *
 * @param {string} id   — UUID do usuário
 * @param {string} nome — Nome do usuário (para mensagem do modal)
 */
function confirmarExcluirItem(id, nome) {
  var tituloModal = 'Excluir usuário';
  var mensagemModal = 'Deseja realmente excluir o usuário "' + nome + '"?';

  mostrarModal(tituloModal, mensagemModal, function () {
    // Encontra o <li> pelo data-id para animar a saída
    var li = listaUsuarios.querySelector('li[data-id="' + id + '"]');

    if (li) {
      animarSaida(li).then(function () {
        excluirUsuario(id);
        renderizarLista();
        mostrarNotificacao('Usuário excluído com sucesso!', 'sucesso');
      });
    } else {
      // Fallback: item já não está no DOM (cenário improvável)
      excluirUsuario(id);
      renderizarLista();
      mostrarNotificacao('Usuário excluído com sucesso!', 'sucesso');
    }
  });
}


// ─────────────────────────────────────────────────────────────
// EXCLUSÃO EM MASSA COM CONFIRMAÇÃO
// ─────────────────────────────────────────────────────────────

/**
 * Solicita confirmação via modal antes de excluir TODOS os usuários.
 * Verifica se há usuários antes de mostrar o modal.
 */
function confirmarExcluirTodos() {
  // Guard clause: sem usuários para excluir
  if (getUsuarios().length === 0) {
    mostrarNotificacao('Não há usuários para excluir.', 'erro');
    return;
  }

  var tituloModal = 'Excluir todos';
  var mensagemModal = 'Deseja realmente excluir TODOS os usuários? Esta ação não pode ser desfeita.';

  mostrarModal(tituloModal, mensagemModal, function () {
    excluirTodosUsuarios();
    renderizarLista();
    mostrarNotificacao('Todos os usuários foram excluídos.', 'sucesso');

    // Limpa campo de pesquisa
    campoPesquisa.value = '';
  });
}


// ─────────────────────────────────────────────────────────────
// PESQUISA POR NOME (COM DEBOUNCE)
// ─────────────────────────────────────────────────────────────

/**
 * Pesquisa usuários pelo nome digitado e re-renderiza a lista
 * com os resultados filtrados. Delegada ao storage.js.
 */
function pesquisar() {
  var termo = campoPesquisa.value;
  var resultado = pesquisarPorNome(termo);
  renderizarLista(resultado);
}


// ─────────────────────────────────────────────────────────────
// LIMPAR FORMULÁRIO
// ─────────────────────────────────────────────────────────────

/**
 * Reseta o formulário e move o foco para o campo nome,
 * proporcionando fluxo contínuo de cadastro.
 */
function limparFormulario() {
  formulario.reset();
  inputNome.focus();
}


// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO (DOMContentLoaded)
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

  // ── Cachear referências DOM ──
  formulario = document.getElementById('form-adm');
  inputNome = document.getElementById('adm-nome');
  inputEmail = document.getElementById('adm-email');
  btnLimpar = document.getElementById('btn-limpar');
  campoPesquisa = document.getElementById('campo-pesquisa');
  btnExcluirTodos = document.getElementById('btn-excluir-todos');
  listaUsuarios = document.getElementById('lista-usuarios');
  listaVazia = document.getElementById('lista-vazia');

  // ── Renderizar lista inicial a partir do Local Storage ──
  renderizarLista();

  //Registrar event listeners

  // Formulário de cadastro
  formulario.addEventListener('submit', cadastrarUsuario);

  // Botão limpar campos
  btnLimpar.addEventListener('click', limparFormulario);

  // Botão excluir todos
  btnExcluirTodos.addEventListener('click', confirmarExcluirTodos);

  // Pesquisa por nome com debounce de 300 ms
  campoPesquisa.addEventListener('input', debounce(pesquisar, 300));
});
