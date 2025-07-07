document.getElementById('footer-container').innerHTML = `
  <footer class="site-footer">
    <p>&copy; <span id="year"></span> <strong>cyberpeshwas</strong> · All rights reserved</p>
    <p>📞 <a href="tel:+918087408986">+91 80874 08986</a> |
      📞 <a href="tel:+918180858531">+91 81808 58531</a> |
       💬 <a href="https://wa.me/918087408986" target="_blank">Chat on WhatsApp</a></p>
  </footer>
`;

document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});
