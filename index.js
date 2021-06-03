#!/usr/bin/env node

const fetch = require('node-fetch');
const [, , site, key, depth = 2] = process.argv;

function letsDo() {
  console.log('\nWork in progress... \n');
  let count = -1;
  let results = [];
  let checked = [];

  return async function (links) {
    if (!checkInput()) return;

    count++;
    let currCount = count;

    for (let i = 0; i < links.length; i++) {
      if (checked.includes(links[i])) continue;

      let html = await getHTML(links[i]);
      results.push(...searchKey(links[i], html));
      checked.push(links[i]);

      if (count <= depth) {
        let links = searchLinks(html);

        letsDo(links);
      }
    }

    if (currCount > depth) {
      console.log(
        `Crawled ${checked.length} pages. Found ${
          results.length
        } combinations with the term ‘${key}’${
          results.length > 0 ? ':' : '.'
        } \n`
      );
      for (let i = 0; i < results.length; i++) {
        if (results[i]) console.log(results[i].join(' => '));
      }
      return;
    }
  };
}
letsDo = letsDo();
letsDo([site]);

function searchKey(url, html) {
  let keyReg = new RegExp(`( [^.!?; ]+){0,2} ${key}( [^.!?; ]+){0,2}`, 'gim');
  let keys = [];

  if (html === null) return [null];
  html = html
    .split(new RegExp('<[^>]*>', 'gmi'))
    .filter((item) => item.length >= key.length);

  for (let i = 0; i < html.length; i++) {
    let keyContext = html[i].match(keyReg);

    if (keyContext) {
      for (let j = 0; j < keyContext.length; j++) {
        keys.push([url, keyContext[j]]);
      }
    }
  }
  return keys.filter((item) => item[1]);
}

async function getHTML(url) {
  let html = await fetch(url)
    .then((res) => {
      return res.text();
    })
    .catch((err) => {
      console.log(err.name + ': ' + url);
      return null;
    });
  return html;
}

function searchLinks(html) {
  let domain = site.match(
    new RegExp('(?<=//www.)[^./]+', 'g') || new RegExp('(?<=//)[^./]+', 'g')
  );
  let keyReg = new RegExp(
    `(?<=href=["'])(${site.match(new RegExp('^[^:.]+[:.]', 'g'))}[^"']+)`,
    'gim'
  );
  let links = [];

  let linksFound = html.match(keyReg);

  if (linksFound) {
    for (let j = 0; j < linksFound.length; j++) {
      if (
        linksFound[j].match(
          new RegExp(`\/\/${domain}|\/\/[^.\/]+\.${domain}`, 'g')
        )
      ) {
        links.push(linksFound[j]);
      }
    }
  }
  return links;
}

function checkInput() {
  if (!site) {
    console.log(
      'You are searching without url. \nCorrect input format: (url) (keyword) (depth of crawling)\n'
    );
    return false;
  }
  if (!key) {
    console.log(
      'You are searching without keyword. \nCorrect input format: (url) (keyword) (depth of crawling)\n'
    );
    return false;
  }
  return true;
}
