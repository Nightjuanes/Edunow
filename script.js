// Small interactive behaviors: update year, button micro-interactions, contrast toggle, simple router demo.

document.addEventListener('DOMContentLoaded', function () {
  // Year in footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Start button animation + dummy action
  const startBtn = document.getElementById('startBtn');
  startBtn.addEventListener('click', function (e) {
    startBtn.disabled = true;
    startBtn.textContent = 'Cargando...';
    startBtn.classList.add('loading');

    // Simulate short loading then navigate to "curso"
    setTimeout(() => {
      startBtn.textContent = '¡Vamos!';
      // animate fill progress a bit
      const fill = document.querySelector('.progress-fill');
      if (fill) { fill.style.width = '62%'; fill.parentElement.setAttribute('aria-valuenow', '62'); }
      // restore button
      setTimeout(() => {
        startBtn.disabled = false;
        startBtn.textContent = 'Continuar aprendiendo';
        startBtn.classList.remove('loading');
      }, 700);
    }, 700);
  });

  // Explore button opens a small modal-like alert (placeholder)
  const exploreBtn = document.getElementById('exploreBtn');
  exploreBtn.addEventListener('click', function (e) {
    alert('Ir a lista de cursos (placeholder).');
  });

  // Contraste toggle (accessibility)
  const contrastToggle = document.getElementById('contrastToggle');
  contrastToggle.addEventListener('click', function () {
    const pressed = contrastToggle.getAttribute('aria-pressed') === 'true';
    contrastToggle.setAttribute('aria-pressed', String(!pressed));
    document.documentElement.classList.toggle('high-contrast');
  });

  // Tiny progressive reveal for progress bar on load
  window.setTimeout(() => {
    const fill = document.querySelector('.progress-fill');
    if (fill) {
      // reading the inline width set in HTML (48%)
      const computed = fill.style.width || '48%';
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        fill.style.transition = 'width 800ms cubic-bezier(.2,.9,.2,1)';
        fill.style.width = computed;
      });
    }
  }, 120);

  // Tour link placeholder
  const tourLink = document.getElementById('tourLink');
  tourLink.addEventListener('click', function (e) {
    e.preventDefault();
    alert('Tour interactivo (placeholder). Puedes conectar aquí tu onboarding JS/route.');
  });
});
