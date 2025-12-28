document.addEventListener('DOMContentLoaded', () => {
  // Küçük bir "tema" toggle butonu varsa çalışsın
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-mode');
    btn.classList.toggle('active');
  });
});