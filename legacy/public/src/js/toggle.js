function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');
  const mainContent = document.getElementById('mainContent');
  const toggleIcon = document.getElementById('toggleIcon');

  sidebar.classList.toggle('collapsed');
  topbar.classList.toggle('collapsed');
  mainContent.classList.toggle('collapsed');
  document.body.classList.toggle('collapsed');

  if (sidebar.classList.contains('collapsed')) {
      toggleIcon.classList.remove('bi-arrow-left-square');
      toggleIcon.classList.add('bi-arrow-right-square');
  } else {
      toggleIcon.classList.remove('bi-arrow-right-square'); // Corrected line
      toggleIcon.classList.add('bi-arrow-left-square');
  }
}