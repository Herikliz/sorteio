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
const newSea = document.getElementById('newSea');
const newName = document.getElementById('newName');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const itemList = document.getElementById('itemList');
const sorteioResult = document.getElementById('sorteioResult');

function updateSubtypes() {
  newSubtype.innerHTML = '';
  if (newType.value === 'Akuma no Mi') {
    newSea.style.display = 'none';
    ['Paramecia', 'Paramecia Especial', 'Logia', 'Zoan', 'Zoan Ancestral', 'Zoan Mítica'].forEach(s => {
      newSubtype.add(new Option(s, s));
    });
  } else {
    newSea.style.display = 'inline-block';
    ['Pirata', 'Marinha/Governo Mundial', 'Independente', 'Despovoada'].forEach(s => {
      newSubtype.add(new Option(s, s));
    });
  }
}

newType.addEventListener('change', updateSubtypes);
updateSubtypes();

document.getElementById('addBtn').addEventListener('click', async () => {
  const rawText = newName.value.trim();
  if (!rawText) return;

  const names = rawText.split('\n');
  
  for (let i = 0; i < names.length; i++) {
    const nameVal = names[i].trim();
    if (!nameVal) continue;
    
    let dataToSave = {
      name: nameVal,
      type: newType.value,
      subtype: newSubtype.value,
      ocupada: false
    };
    
    if (newType.value === 'Ilha') {
      dataToSave.mar = newSea.value;
    }

    await addDoc(colRef, dataToSave);
  }

  newName.value = '';
});

const pedidosArea = document.getElementById('pedidosArea');

onSnapshot(colRef, (snapshot) => {
  items = [];
  snapshot.forEach(documento => {
    items.push({ id: documento.id, ...documento.data() });
  });
  renderList();
  renderPedidos();
});

function renderPedidos() {
  pedidosArea.innerHTML = '';
  const pendentes = items.filter(i => i.pedidoPor && !i.ocupada);
  
  if (pendentes.length > 0) {
    const box = document.createElement('div');
    box.style.background = '#3b2a1a';
    box.style.padding = '15px';
    box.style.marginBottom = '20px';
    box.style.borderRadius = '8px';
    box.style.borderLeft = '5px solid #f39c12';
    
    const titulo = document.createElement('h3');
    titulo.textContent = 'Pedidos Pendentes';
    titulo.style.marginTop = '0';
    box.appendChild(titulo);
    
    pendentes.forEach(item => {
      const p = document.createElement('p');
      p.textContent = `Personagem "${item.pedidoNome}" selecionou a fruta ${item.name} (${item.subtype}).`;
      
      const btnAprovar = document.createElement('button');
      btnAprovar.textContent = 'Aprovar';
      btnAprovar.style.backgroundColor = '#27ae60';
      btnAprovar.style.marginRight = '10px';
      btnAprovar.onclick = async () => {
        await updateDoc(doc(db, "lista_one_piece_db", item.id), { ocupada: true, donoId: item.pedidoPor });
      };
      
      const btnNegar = document.createElement('button');
      btnNegar.textContent = 'Negar';
      btnNegar.style.backgroundColor = '#c0392b';
      btnNegar.onclick = async () => {
        await updateDoc(doc(db, "fichas_op", item.pedidoPor), { "info.akumaNome": "", "info.akumaId": "" });
        await updateDoc(doc(db, "lista_one_piece_db", item.id), { pedidoPor: null, pedidoNome: null });
      };
      
      p.appendChild(document.createElement('br'));
      p.appendChild(document.createElement('br'));
      p.appendChild(btnAprovar);
      p.appendChild(btnNegar);
      box.appendChild(p);
    });
    
    pedidosArea.appendChild(box);
  }
}

function renderList() {
  itemList.innerHTML = '';
  const search = searchInput.value.toLowerCase();
  const cat = filterCategory.value;

  let filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search);
    let matchCat = false;
    
    if (cat === 'Tudo') matchCat = true;
    if (cat === 'Frutas' && item.type === 'Akuma no Mi') matchCat = true;
    if (cat === 'Ilhas' && item.type === 'Ilha') matchCat = true;

    return matchSearch && matchCat;
  });

  filtered.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
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
    let itemText = `${item.name} (${item.subtype})`;
    if (item.type === 'Ilha' && item.mar) {
      itemText += ` - ${item.mar}`;
    }
    span.textContent = itemText;
    li.appendChild(span);

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Editar';
    editBtn.style.backgroundColor = '#f39c12';
    editBtn.style.marginRight = '10px';

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
      editBtn.style.marginLeft = 'auto';
    }

    editBtn.addEventListener('click', () => {
      li.innerHTML = '';
      li.style.flexWrap = 'wrap';
      li.style.gap = '10px';

      const editName = document.createElement('input');
      editName.type = 'text';
      editName.value = item.name;
      editName.style.flex = '1';

      const editType = document.createElement('select');
      editType.innerHTML = `<option value="Akuma no Mi" ${item.type === 'Akuma no Mi' ? 'selected' : ''}>Akuma no Mi</option>
                            <option value="Ilha" ${item.type === 'Ilha' ? 'selected' : ''}>Ilha</option>`;

      const editSubtype = document.createElement('select');

      const editSea = document.createElement('select');
      ['East Blue', 'West Blue', 'North Blue', 'South Blue', 'Paraíso', 'Novo Mundo', 'Calm Belt'].forEach(s => {
        editSea.add(new Option(s, s, false, s === item.mar));
      });

      function updateEditSubtypes() {
        editSubtype.innerHTML = '';
        if (editType.value === 'Akuma no Mi') {
          editSea.style.display = 'none';
          ['Paramecia', 'Paramecia Especial', 'Logia', 'Zoan', 'Zoan Ancestral', 'Zoan Mítica'].forEach(s => {
            editSubtype.add(new Option(s, s, false, s === item.subtype));
          });
        } else {
          editSea.style.display = 'inline-block';
          ['Pirata', 'Marinha/Governo Mundial', 'Independente', 'Despovoada'].forEach(s => {
            editSubtype.add(new Option(s, s, false, s === item.subtype));
          });
        }
      }
      editType.addEventListener('change', updateEditSubtypes);
      updateEditSubtypes();

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Salvar';
      saveBtn.style.backgroundColor = '#27ae60';
      saveBtn.addEventListener('click', async () => {
        let dataToUpdate = {
          name: editName.value.trim(),
          type: editType.value,
          subtype: editSubtype.value
        };
        if (editType.value === 'Ilha') {
          dataToUpdate.mar = editSea.value;
        } else {
          dataToUpdate.mar = null;
        }
        await updateDoc(doc(db, "lista_one_piece_db", item.id), dataToUpdate);
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancelar';
      cancelBtn.style.backgroundColor = '#7f8c8d';
      cancelBtn.addEventListener('click', () => renderList());

      li.append(editName, editType, editSubtype, editSea, saveBtn, cancelBtn);
    });

    delBtn.addEventListener('click', async () => {
      await deleteDoc(doc(db, "lista_one_piece_db", item.id));
    });
    
    li.appendChild(editBtn);
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
      let textoSorteio = `${item.name} (${item.subtype})`;
      if (item.type === 'Ilha' && item.mar) {
        textoSorteio += ` - ${item.mar}`;
      }
      li.textContent = textoSorteio;
      ul.appendChild(li);
    });
    sorteioResult.appendChild(ul);
  }
});