const titleEl = document.getElementById('title');
const notesEl = document.getElementById('notes');
const addBtn = document.getElementById('add');
const listEl = document.getElementById('list');

async function refresh() {
  const items = await window.api.listItems();
  listEl.innerHTML = items
    .map(it => `
      <li>
        <b>${it.title}</b><br>
        ${it.notes || ''}<br>
        <small>${it.created_at}</small><br>
        <button onclick="del(${it.id})">Eliminar</button>
      </li>
    `).join('');
}

addBtn.addEventListener('click', async () => {
  const title = titleEl.value.trim();
  const notes = notesEl.value.trim();
  if (!title) return alert('Escribe un título');
  await window.api.addItem({ title, notes });
  titleEl.value = '';
  notesEl.value = '';
  refresh();
});

window.del = async (id) => {
  await window.api.deleteItem(id);
  refresh();
};

refresh();
