/**
 * ui.js — Componentes de interface reutilizáveis do Projeto Bicho
 *
 * Fornece:
 *   - mostrarModal(titulo, mensagem, callbackConfirmar)
 *   - mostrarNotificacao(mensagem, tipo)
 *   - animarEntrada(elemento)
 *   - animarSaida(elemento)
 *
 * REGRA: todo DOM é criado via document.createElement(), NUNCA innerHTML.
 */

/* ============================================================
   1. Modal de Confirmação
   ============================================================ */

/**
 * Exibe um modal de confirmação com dois botões (Cancelar / Confirmar).
 * Trap de foco entre os botões, fecha com Escape ou clique fora.
 *
 * @param {string} titulo - Título do modal
 * @param {string} mensagem - Mensagem descritiva
 * @param {Function} callbackConfirmar - Função executada ao confirmar
 */
function mostrarModal(titulo, mensagem, callbackConfirmar) {
  var container = document.getElementById('modal-container');

  // ── Overlay ──
  var overlay = document.createElement('div');
  overlay.classList.add('modal-overlay');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modal-titulo');
  overlay.setAttribute('aria-describedby', 'modal-mensagem');

  // ── Card ──
  var card = document.createElement('div');
  card.classList.add('modal-card');

  // ── Título ──
  var h2 = document.createElement('h2');
  h2.classList.add('modal-titulo');
  h2.id = 'modal-titulo';
  h2.textContent = titulo;

  // ── Mensagem ──
  var p = document.createElement('p');
  p.classList.add('modal-mensagem');
  p.id = 'modal-mensagem';
  p.textContent = mensagem;

  // ── Botões ──
  var divBotoes = document.createElement('div');
  divBotoes.classList.add('modal-botoes');

  var btnCancelar = document.createElement('button');
  btnCancelar.type = 'button';
  btnCancelar.classList.add('btn-modal-cancelar');
  btnCancelar.textContent = 'Cancelar';

  var btnConfirmar = document.createElement('button');
  btnConfirmar.type = 'button';
  btnConfirmar.classList.add('btn-modal-confirmar');
  btnConfirmar.textContent = 'Confirmar';

  divBotoes.appendChild(btnCancelar);
  divBotoes.appendChild(btnConfirmar);

  card.appendChild(h2);
  card.appendChild(p);
  card.appendChild(divBotoes);
  overlay.appendChild(card);
  container.appendChild(overlay);

  // ── Guardar elemento que tinha foco antes de abrir ──
  var elementoAnterior = document.activeElement;

  // ── Foco inicial no botão Cancelar ──
  btnCancelar.focus();

  // ── Função para fechar com animação de saída ──
  function fecharModal() {
    overlay.classList.add('modal-saindo');
    card.classList.add('modal-card-saindo');

    card.addEventListener('animationend', function () {
      if (container.contains(overlay)) {
        container.removeChild(overlay);
      }
      // Restaurar foco ao elemento anterior
      if (elementoAnterior && elementoAnterior.focus) {
        elementoAnterior.focus();
      }
    }, { once: true });
  }

  // ── Eventos de fechar ──
  btnCancelar.addEventListener('click', fecharModal);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      fecharModal();
    }
  });

  // ── Confirmar ──
  btnConfirmar.addEventListener('click', function () {
    if (typeof callbackConfirmar === 'function') {
      callbackConfirmar();
    }
    fecharModal();
  });

  // ── Teclado: Escape fecha, Tab/Shift+Tab faz trap de foco ──
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      fecharModal();
      return;
    }

    if (e.key === 'Tab') {
      var botoesDoModal = [btnCancelar, btnConfirmar];
      var indiceAtual = botoesDoModal.indexOf(document.activeElement);

      if (e.shiftKey) {
        // Shift + Tab: voltar
        if (indiceAtual <= 0) {
          e.preventDefault();
          botoesDoModal[botoesDoModal.length - 1].focus();
        }
      } else {
        // Tab: avançar
        if (indiceAtual >= botoesDoModal.length - 1) {
          e.preventDefault();
          botoesDoModal[0].focus();
        }
      }
    }
  });
}


/* ============================================================
   2. Notificação Toast
   ============================================================ */

/**
 * Exibe uma notificação toast no canto superior direito.
 * Auto-dismiss após 3 segundos com animação de saída.
 *
 * @param {string} mensagem - Texto da notificação
 * @param {'sucesso'|'erro'} tipo - Tipo visual da notificação
 */
function mostrarNotificacao(mensagem, tipo) {
  var container = document.getElementById('notificacao-container');

  // ── Elemento da notificação ──
  var notificacao = document.createElement('div');
  notificacao.classList.add('notificacao');
  notificacao.setAttribute('role', 'status');

  if (tipo === 'sucesso') {
    notificacao.classList.add('notificacao--sucesso');
  } else {
    notificacao.classList.add('notificacao--erro');
  }

  // ── Ícone ──
  var icone = document.createElement('span');
  icone.classList.add('notificacao-icone');
  icone.setAttribute('aria-hidden', 'true');
  icone.textContent = tipo === 'sucesso' ? '✓' : '✕';

  // ── Texto ──
  var texto = document.createElement('span');
  texto.classList.add('notificacao-texto');
  texto.textContent = mensagem;

  notificacao.appendChild(icone);
  notificacao.appendChild(texto);
  container.appendChild(notificacao);

  // ── Auto-dismiss após 3 segundos ──
  setTimeout(function () {
    notificacao.classList.add('notificacao-saindo');

    notificacao.addEventListener('animationend', function () {
      if (container.contains(notificacao)) {
        container.removeChild(notificacao);
      }
    }, { once: true });
  }, 3000);
}


/* ============================================================
   3. Animações de Lista
   ============================================================ */

/**
 * Anima a entrada de um elemento com fadeInUp.
 * Remove a classe de animação após concluir.
 *
 * @param {HTMLElement} elemento - Elemento a animar
 */
function animarEntrada(elemento) {
  elemento.classList.add('fadeInUp');

  elemento.addEventListener('animationend', function () {
    elemento.classList.remove('fadeInUp');
  }, { once: true });
}

/**
 * Anima a saída de um elemento com fadeOutRight.
 * Retorna uma Promise que resolve quando a animação termina.
 *
 * @param {HTMLElement} elemento - Elemento a animar
 * @returns {Promise} Resolve quando a animação completa
 */
function animarSaida(elemento) {
  return new Promise(function (resolve) {
    elemento.classList.add('fadeOutRight');

    elemento.addEventListener('animationend', function () {
      elemento.classList.remove('fadeOutRight');
      resolve();
    }, { once: true });
  });
}
