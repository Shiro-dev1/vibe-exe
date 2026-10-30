// Окошко с командной строкой на страницах-документациях: в правом нижнем углу
function startDocsTerminal(page, loaded) {
  const term = VibeTerm.create({
    page,
    solid: true,
    intro: ["> " + loaded],
    place(win) {
      const phone = innerWidth < 640;
      const w = phone ? innerWidth - 32 : 400;
      const h = phone ? 170 : 220;
      win.style.width = w + "px";
      win.style.height = h + "px";
      win.style.left = (innerWidth - w - (phone ? 16 : 28)) + "px";
      win.style.top = (innerHeight - h - (phone ? 16 : 28)) + "px";
    },
  });
  setTimeout(() => term.show(), 300);
}
