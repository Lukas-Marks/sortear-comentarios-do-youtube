const puppeteer = require('puppeteer');
const readline = require('readline');

// Interface para capturar entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Digite o comentário/hashtag que deseja procurar: ', async (inputComentario) => {
  const comentario = new RegExp(inputComentario, 'i'); // regex para ignorar maiúsculas/minúsculas

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('https://www.youtube.com/watch?v=J2Q4Nfs04yA', {
    waitUntil: 'networkidle2',
  });

  await page.waitForSelector('h1.title');
  console.log('Carregou o título');

  // Scroll inicial
  await page.evaluate(() => window.scrollBy(0, 2000));
  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.waitForSelector('h2#count');
  console.log('Seletor carregou dos comentários...');

  console.log('Vamos começar o auto scroll..');
  await autoScroll(page);

  // Captura todos os comentários e autores
  const commentsData = await page.evaluate(() => {
    const nodes = document.querySelectorAll('#comment #content-text');
    const authors = document.querySelectorAll('#comment #author-text span');

    const result = [];
    nodes.forEach((node, i) => {
      const text = node.innerText.trim();
      const author = authors[i] ? authors[i].innerText.trim() : 'Desconhecido';
      result.push({ author, text });
    });
    return result;
  });

  console.log('Total carregado: ' + commentsData.length);

  // Filtra pela entrada do usuário
  const filtrados = commentsData.filter(c => comentario.test(c.text));

  if (filtrados.length > 0) {
    filtrados.forEach(c => console.log(c.author + ': ' + c.text));
    const sorteado = filtrados[getRandomInt(0, filtrados.length - 1)];
    console.log('A pessoa sorteada foi: ' + sorteado.author);
  } else {
    console.log('Nenhum comentário encontrado com "' + inputComentario + '"');
  }

  await browser.close();
  rl.close();
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}
