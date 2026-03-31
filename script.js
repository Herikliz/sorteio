import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
const newPrice = document.getElementById('newPrice');
const searchInput = document.getElementById('searchInput');

function formatCurrency(val) {
  let num = parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR');
}

newPrice.addEventListener('input', (e) => {
  e.target.value = formatCurrency(e.target.value);
});
const filterCategory = document.getElementById('filterCategory');
const itemList = document.getElementById('itemList');
const sorteioResult = document.getElementById('sorteioResult');

function updateSubtypes() {
  newSubtype.innerHTML = '';
  if (newType.value === 'Akuma no Mi') {
    newSea.style.display = 'none';
    newPrice.style.display = 'inline-block';
    if (!newPrice.value) newPrice.value = "100.000.000";
    newSubtype.multiple = false;
    newSubtype.style.height = 'auto';
    ['Paramecia', 'Paramecia Especial', 'Logia', 'Zoan', 'Zoan Ancestral', 'Zoan Mítica'].forEach(s => {
      newSubtype.add(new Option(s, s));
    });
  } else {
    newSea.style.display = 'inline-block';
    newPrice.style.display = 'none';
    newSubtype.multiple = true;
    newSubtype.style.height = '80px';
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
  const selectedSubtypes = Array.from(newSubtype.selectedOptions).map(opt => opt.value).join(', ');
  
  for (let i = 0; i < names.length; i++) {
    const nameVal = names[i].trim();
    if (!nameVal) continue;

    const jaExiste = items.find(item => item.name.toLowerCase() === nameVal.toLowerCase() && item.type === newType.value);
    if (jaExiste) continue;
    
    let dataToSave = {
      name: nameVal,
      type: newType.value,
      subtype: selectedSubtypes,
      ocupada: false,
      criadoEm: Date.now()
    };
    
    if (newType.value === 'Akuma no Mi') {
      let p = parseInt(newPrice.value.replace(/\D/g, '')) || 100000000;
      if (p < 100000000) p = 100000000;
      dataToSave.preco = p;
    } else if (newType.value === 'Ilha') {
      dataToSave.mar = newSea.value;
    }

    const docId = nameVal.replace(/\//g, '-');
    await setDoc(doc(db, "lista_one_piece_db", docId), dataToSave);
    items.push({ id: docId, ...dataToSave });
  }

  newName.value = '';
});

const pedidosArea = document.getElementById('pedidosArea');

onSnapshot(colRef, (snapshot) => {
  let tempItems = [];
  snapshot.forEach(documento => {
    tempItems.push({ id: documento.id, ...documento.data() });
  });

  tempItems.sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));

  items = [];
  const nomesVistos = new Set();

  tempItems.forEach(item => {
    const chave = item.name.toLowerCase() + "_" + item.type;
    
    if (nomesVistos.has(chave)) {
      deleteDoc(doc(db, "lista_one_piece_db", item.id));
    } else {
      nomesVistos.add(chave);
      items.push(item);
    }
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
    if (cat === 'Paramecias' && item.type === 'Akuma no Mi' && item.subtype.includes('Paramecia')) matchCat = true;
    if (cat === 'Logias' && item.type === 'Akuma no Mi' && item.subtype === 'Logia') matchCat = true;
    if (cat === 'Zoans' && item.type === 'Akuma no Mi' && item.subtype.includes('Zoan')) matchCat = true;
    if (cat === 'AkumasUso' && item.type === 'Akuma no Mi' && item.ocupada) matchCat = true;
    if (cat === 'Ilhas' && item.type === 'Ilha') matchCat = true;
    if (cat.startsWith('Ilha-') && item.type === 'Ilha' && item.mar === cat.substring(5)) matchCat = true;

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
    } else if (item.type === 'Akuma no Mi') {
      itemText += ` - ฿${(item.preco || 100000000).toLocaleString('pt-BR')}`;
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
        let updateData = { ocupada: cb.checked };
        if (cb.checked && item.pedidoPor) updateData.donoId = item.pedidoPor;
        else if (!cb.checked) updateData.donoId = null;
        await updateDoc(docRef, updateData);
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

      const editPrice = document.createElement('input');
      editPrice.type = 'text';
      editPrice.value = (item.preco || 100000000).toLocaleString('pt-BR');
      editPrice.style.width = '120px';
      editPrice.addEventListener('input', (e) => {
        e.target.value = formatCurrency(e.target.value);
      });

      const editSea = document.createElement('select');
      ['East Blue', 'West Blue', 'North Blue', 'South Blue', 'Paraíso', 'Novo Mundo', 'Calm Belt', 'Localização Desconhecida'].forEach(s => {
        editSea.add(new Option(s, s, false, s === item.mar));
      });

      function updateEditSubtypes() {
        editSubtype.innerHTML = '';
        const currentSubtypes = item.subtype ? item.subtype.split(', ') : [];
        if (editType.value === 'Akuma no Mi') {
          editSea.style.display = 'none';
          editPrice.style.display = 'inline-block';
          editSubtype.multiple = false;
          editSubtype.style.height = 'auto';
          ['Paramecia', 'Paramecia Especial', 'Logia', 'Zoan', 'Zoan Ancestral', 'Zoan Mítica'].forEach(s => {
            editSubtype.add(new Option(s, s, false, s === item.subtype));
          });
        } else {
          editSea.style.display = 'inline-block';
          editPrice.style.display = 'none';
          editSubtype.multiple = true;
          editSubtype.style.height = '80px';
          ['Pirata', 'Marinha/Governo Mundial', 'Independente', 'Despovoada'].forEach(s => {
            editSubtype.add(new Option(s, s, false, currentSubtypes.includes(s)));
          });
        }
      }
      editType.addEventListener('change', updateEditSubtypes);
      updateEditSubtypes();

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Salvar';
      saveBtn.style.backgroundColor = '#27ae60';
      saveBtn.onclick = async () => {
        const novoNome = editName.value.trim();
        const selectedEditSubtypes = Array.from(editSubtype.selectedOptions).map(opt => opt.value).join(', ');
        const itemIdOriginal = item.id;
        
        let dataToUpdate = {
          name: novoNome,
          type: editType.value,
          subtype: selectedEditSubtypes,
          ocupada: item.ocupada !== undefined ? item.ocupada : false
        };
        
        if (item.criadoEm) dataToUpdate.criadoEm = item.criadoEm;
        if (item.pedidoPor) dataToUpdate.pedidoPor = item.pedidoPor;
        if (item.pedidoNome) dataToUpdate.pedidoNome = item.pedidoNome;
        if (item.donoId) dataToUpdate.donoId = item.donoId;
        
        if (editType.value === 'Akuma no Mi') {
          let p = parseInt(editPrice.value.replace(/\D/g, '')) || 100000000;
          if (p < 100000000) p = 100000000;
          dataToUpdate.preco = p;
        } else if (editType.value === 'Ilha') {
          dataToUpdate.mar = editSea.value;
        }

        const novoId = novoNome.replace(/\//g, '-');
        
        try {
          if (novoId !== itemIdOriginal) {
            await setDoc(doc(db, "lista_one_piece_db", novoId), dataToUpdate);
            await deleteDoc(doc(db, "lista_one_piece_db", itemIdOriginal));
          } else {
            await updateDoc(doc(db, "lista_one_piece_db", itemIdOriginal), dataToUpdate);
          }
        } catch (e) {
          alert("Erro ao salvar: " + e.message);
        }
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancelar';
      cancelBtn.style.backgroundColor = '#7f8c8d';
      cancelBtn.addEventListener('click', () => renderList());

      li.append(editName, editType, editSubtype, editPrice, editSea, saveBtn, cancelBtn);
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

const sorteioModal = document.getElementById('sorteioModal');
const sorteioMinPreco = document.getElementById('sorteioMinPreco');
const sorteioMaxPreco = document.getElementById('sorteioMaxPreco');

function getMaxAkumaPrice() {
  const akumas = items.filter(i => i.type === 'Akuma no Mi');
  if (akumas.length === 0) return 100000000;
  return Math.max(...akumas.map(a => a.preco || 100000000));
}

sorteioMinPreco.addEventListener('input', (e) => {
  e.target.value = formatCurrency(e.target.value);
});

sorteioMaxPreco.addEventListener('input', (e) => {
  let raw = parseInt(e.target.value.replace(/\D/g, '')) || 0;
  let maxAllowed = getMaxAkumaPrice();
  if (raw > maxAllowed) raw = maxAllowed;
  e.target.value = raw.toLocaleString('pt-BR');
});

document.getElementById('sortearBtn').addEventListener('click', () => {
  let maxAllowed = getMaxAkumaPrice();
  sorteioMaxPreco.value = maxAllowed.toLocaleString('pt-BR');
  sorteioModal.style.display = 'flex';
});

document.getElementById('btnCancelarSorteio').addEventListener('click', () => {
  sorteioModal.style.display = 'none';
});

document.getElementById('btnDesocuparTodas').addEventListener('click', async () => {
  let confirmacao = confirm("Tem certeza? Isso vai desocupar TODAS as frutas do banco de dados e remover os donos.");
  if (!confirmacao) return;

  let ocupadas = items.filter(i => i.type === 'Akuma no Mi' && i.ocupada);

  if (ocupadas.length === 0) {
    alert("Nenhuma fruta para desocupar.");
    return;
  }

  let count = 0;
  for (let item of ocupadas) {
    const docRef = doc(db, "lista_one_piece_db", item.id);
    await updateDoc(docRef, {
      ocupada: false,
      donoId: null,
      pedidoPor: null,
      pedidoNome: null
    });
    count++;
  }

  alert(count + " frutas foram desocupadas com sucesso!");
});

document.getElementById('btnConfirmarSorteio').addEventListener('click', () => {
  sorteioModal.style.display = 'none';
  sorteioResult.innerHTML = '';
  sorteioResult.style.display = 'none';

  let qtdAkuma = parseInt(document.getElementById('sorteioQtdAkuma').value) || 0;
  let qtdIlhas = parseInt(document.getElementById('sorteioQtdIlha').value) || 0;

  let minPreco = parseInt(sorteioMinPreco.value.replace(/\D/g, '')) || 100000000;
  let maxPreco = parseInt(sorteioMaxPreco.value.replace(/\D/g, '')) || 100000000;

  let subAkumaAllowed = Array.from(document.querySelectorAll('.chk-akuma-sub:checked')).map(cb => cb.value);
  let subIlhaAllowed = Array.from(document.querySelectorAll('.chk-ilha-sub:checked')).map(cb => cb.value);
  let marIlhaAllowed = Array.from(document.querySelectorAll('.chk-ilha-mar:checked')).map(cb => cb.value);

  let akumas = items.filter(i => {
    if (i.type !== 'Akuma no Mi' || i.ocupada) return false;
    let preco = i.preco || 100000000;
    if (preco < minPreco || preco > maxPreco) return false;
    return subAkumaAllowed.includes(i.subtype);
  });

  let ilhas = items.filter(i => {
    if (i.type !== 'Ilha') return false;
    let marVal = i.mar || 'Localização Desconhecida';
    if (!marIlhaAllowed.includes(marVal)) return false;
    
    const ilhaSubtypes = i.subtype ? i.subtype.split(', ') : [];
    const hasAllowedSubtype = ilhaSubtypes.some(sub => subIlhaAllowed.includes(sub));
    if (ilhaSubtypes.length > 0 && !hasAllowedSubtype) return false;
    
    return true;
  });

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  shuffleArray(akumas);
  akumas = akumas.slice(0, qtdAkuma);

  shuffleArray(ilhas);
  ilhas = ilhas.slice(0, qtdIlhas);

  akumas.sort((a, b) => a.name.localeCompare(b.name));
  ilhas.sort((a, b) => a.name.localeCompare(b.name));

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

    const btnCopiar = document.createElement('button');
    btnCopiar.textContent = "Copiar Sorteio";
    btnCopiar.style.marginTop = "15px";
    btnCopiar.style.backgroundColor = "#27ae60";
    btnCopiar.onclick = () => {
      let nomeIlha = ilhas.length > 0 ? ilhas[0].name : "Nenhuma";
      let texto = "*SORTEIO DAS FRUTAS QUE ESTÃO PRESENTES NA GRAND LINE PARA SEREM COMPRADAS*\n\n";
      texto += `* Ilha: *${nomeIlha}*\n\n`;
      texto += "* Frutas:\n";
      akumas.forEach((akuma, index) => {
        texto += `${index + 1}. *${akuma.name} - ฿${(akuma.preco || 100000000).toLocaleString('pt-BR')}*\n`;
      });
      texto += "\nAbaixo estão os links que lhes permite verificar qual é a cada uma das Frutas.\n";
      texto += "1. https://sites.google.com/view/new-seas-op/submundo/akuma-no-mi/logia\n";
      texto += "2. https://sites.google.com/view/new-seas-op/submundo/akuma-no-mi/paramecia\n";
      texto += "3. https://sites.google.com/view/new-seas-op/submundo/akuma-no-mi/zoan";
      navigator.clipboard.writeText(texto).then(() => {
        alert("Sorteio copiado com sucesso!");
      }).catch(err => {
        alert("Erro ao copiar: " + err);
      });
    };
    sorteioResult.appendChild(btnCopiar);
  } else {
    alert("Nenhum item encontrado com os filtros selecionados!");
  }
});