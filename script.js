import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDG9zDcphqyTfXXZBWc0-uRV74eeie_tEE",
  authDomain: "new-seas.firebaseapp.com",
  projectId: "new-seas",
  storageBucket: "new-seas.firebasestorage.app",
  messagingSenderId: "551983006255",
  appId: "1:551983006255:web:29dae15ad04dabff7afcda"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const colRef = collection(db, "lista_one_piece_db");

let items = [];

const newType = document.getElementById('newType');
const newSubtype = document.getElementById('newSubtype');
const newName = document.getElementById('newName');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const itemList = document.getElementById('itemList');
const sorteioResult = document.getElementById('sorteioResult');

function updateSubtypes() {
  newSubtype.innerHTML = '';
  if (newType.value === 'Akuma no Mi') {
    ['Paramecia', 'Paramecia Especial', 'Logia', 'Zoan', 'Zoan Ancestral', 'Zoan Mítica'].forEach(s => {
      newSubtype.add(new Option(s, s));
    });
  } else {
    ['Pirata', 'Marinha/Governo Mundial', 'Independente', 'Despovoada'].forEach(s => {
      newSubtype.add(new Option(s, s));
    });
  }
}

newType.addEventListener('change', updateSubtypes);
updateSubtypes();

document.getElementById('addBtn').addEventListener('click', async () => {
  const nameVal = newName.value.trim();
  if (!nameVal) return;
  await addDoc(colRef, {
    name: nameVal,
    type: newType.value,
    subtype: newSubtype.value,
    ocupada: false
  });
  newName.value = '';
});

onSnapshot(colRef, (snapshot) => {
  items = [];
  snapshot.forEach(documento => {
    items.push({ id: documento.id, ...documento.data() });
  });
  renderList();
});

function renderList() {
  itemList.innerHTML = '';
  const search = searchInput.value.toLowerCase();
  const cat = filterCategory.value;

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search);
    let matchCat = false;
    
    if (cat === 'Paramecias' && item.type === 'Akuma no Mi' && item.subtype.includes('Paramecia')) matchCat = true;
    if (cat === 'Logias' && item.type === 'Akuma no Mi' && item.subtype === 'Logia') matchCat = true;
    if (cat === 'Zoans' && item.type === 'Akuma no Mi' && item.subtype.includes('Zoan')) matchCat = true;
    if (cat === 'Ilhas' && item.type === 'Ilha') matchCat = true;

    return matchSearch && matchCat;
  });

  filtered.forEach(item => {
    const li = document.createElement('li');
    
    if (item.type === 'Ilha') {
      li.classList.add('color-ilha');
    } else if (item.subtype.includes('Paramecia')) {
      li.classList.add('color-paramecia');
    } else if (item.subtype === 'Logia') {
      li.classList.add('color-logia');
    } else if (item.subtype.includes('Zoan')) {
      li.classList.add('color-zoan');
    }

    const span = document.createElement('span');
    span.textContent = `${item.name} (${item.subtype})`;
    li.appendChild(span);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Remover';
    delBtn.className = 'btn-delete';
    
    if (item.type === 'Akuma no Mi') {
      const label = document.createElement('label');
      label.className = 'ocupada-label';
      
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = item.ocupada;
      cb.addEventListener('change', async () => {
        const docRef = doc(db, "lista_one_piece_db", item.id);
        await updateDoc(docRef, { ocupada: cb.checked });
      });
      
      label.appendChild(cb);
      label.appendChild(document.createTextNode('Ocupada'));
      li.appendChild(label);
    } else {
      delBtn.style.marginLeft = 'auto';
    }

    delBtn.addEventListener('click', async () => {
      await deleteDoc(doc(db, "lista_one_piece_db", item.id));
    });
    li.appendChild(delBtn);

    itemList.appendChild(li);
  });
}

searchInput.addEventListener('keyup', renderList);
filterCategory.addEventListener('change', renderList);

document.getElementById('sortearBtn').addEventListener('click', () => {
  sorteioResult.innerHTML = '';
  sorteioResult.style.display = 'none';

  let qtdAkuma = prompt("Quantas Akuma no Mi deseja sortear?");
  if (qtdAkuma === null) return;
  let qtdIlhas = prompt("Quantas Ilhas deseja sortear?");
  if (qtdIlhas === null) return;

  qtdAkuma = parseInt(qtdAkuma) || 0;
  qtdIlhas = parseInt(qtdIlhas) || 0;

  let akumas = items.filter(i => i.type === 'Akuma no Mi' && !i.ocupada);
  let ilhas = items.filter(i => i.type === 'Ilha');

  akumas = akumas.sort(() => 0.5 - Math.random()).slice(0, qtdAkuma);
  ilhas = ilhas.sort(() => 0.5 - Math.random()).slice(0, qtdIlhas);

  const sorteados = [...akumas, ...ilhas];

  if (sorteados.length > 0) {
    sorteioResult.style.display = 'block';
    const h3 = document.createElement('h3');
    h3.textContent = "Resultado do Sorteio:";
    sorteioResult.appendChild(h3);
    
    const ul = document.createElement('ul');
    sorteados.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} (${item.subtype})`;
      ul.appendChild(li);
    });
    sorteioResult.appendChild(ul);
  }
});