const defaultData = [
  { id: 1, name: "Fruta do Crescimento", type: "Akuma no Mi", subtype: "Paramecia" },
  { id: 2, name: "Fruta do Chicote", type: "Akuma no Mi", subtype: "Paramecia" },
  { id: 3, name: "Sandy", type: "Ilha", subtype: "" },
  { id: 4, name: "Sabaody", type: "Ilha", subtype: "" }
];

let items = JSON.parse(localStorage.getItem('savedItemsList'));

if (!items) {
  items = defaultData;
  saveItems();
}

function saveItems() {
  localStorage.setItem('savedItemsList', JSON.stringify(items));
}

function toggleSubtype() {
  const type = document.getElementById('newType').value;
  const subtypeSelect = document.getElementById('newSubtype');
  if (type === 'Ilha') {
    subtypeSelect.style.display = 'none';
    subtypeSelect.value = '';
  } else {
    subtypeSelect.style.display = 'inline-block';
    subtypeSelect.value = 'Paramecia';
  }
}

function addItem() {
  const name = document.getElementById('newName').value.trim();
  const type = document.getElementById('newType').value;
  const subtype = document.getElementById('newSubtype').value;

  if (!name) return;

  const newItem = {
    id: Date.now(),
    name,
    type,
    subtype
  };

  items.push(newItem);
  saveItems();
  document.getElementById('newName').value = '';
  renderList();
}

function removeItem(id) {
  items = items.filter(item => item.id !== id);
  saveItems();
  renderList();
}

function renderList() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const fType = document.getElementById('filterType').value;
  const fSubtype = document.getElementById('filterSubtype').value;
  const listEl = document.getElementById('itemList');

  listEl.innerHTML = '';

  let filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search);
    const matchType = fType === "" || item.type === fType;
    const matchSubtype = fSubtype === "" || item.subtype === fSubtype;
    return matchSearch && matchType && matchSubtype;
  });

  filtered.forEach(item => {
    const li = document.createElement('li');
    
    const textSpan = document.createElement('span');
    let content = `${item.name} - ${item.type}`;
    if (item.subtype) {
      content += ` (${item.subtype})`;
    }
    textSpan.textContent = content;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Remover';
    deleteBtn.className = 'btn-delete';
    deleteBtn.onclick = () => removeItem(item.id);

    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  });
}

function sortear() {
  const resultEl = document.getElementById('sorteioResult');
  resultEl.innerHTML = '';
  resultEl.style.display = 'none';

  let qtdAkuma = prompt("Quantas Akuma no Mi deseja sortear?");
  if (qtdAkuma === null) return;
  
  let qtdIlhas = prompt("Quantas Ilhas deseja sortear?");
  if (qtdIlhas === null) return;

  qtdAkuma = parseInt(qtdAkuma) || 0;
  qtdIlhas = parseInt(qtdIlhas) || 0;

  let akumas = items.filter(i => i.type === 'Akuma no Mi');
  let ilhas = items.filter(i => i.type === 'Ilha');

  akumas = akumas.sort(() => 0.5 - Math.random()).slice(0, qtdAkuma);
  ilhas = ilhas.sort(() => 0.5 - Math.random()).slice(0, qtdIlhas);

  const sorteados = [...akumas, ...ilhas];

  if (sorteados.length > 0) {
    resultEl.style.display = 'block';
    const h3 = document.createElement('h3');
    h3.textContent = "Resultado do Sorteio:";
    h3.style.marginTop = '0';
    resultEl.appendChild(h3);
    
    const ul = document.createElement('ul');
    sorteados.forEach(item => {
      const li = document.createElement('li');
      let content = `${item.name} - ${item.type}`;
      if (item.subtype) {
        content += ` (${item.subtype})`;
      }
      li.textContent = content;
      ul.appendChild(li);
    });
    resultEl.appendChild(ul);
  }
}

window.onload = () => {
  toggleSubtype();
  renderList();
};