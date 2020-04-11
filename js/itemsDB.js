const itemsByID = new Map();

for (let i = 0; i < items.length; ++i) {
  itemsByID.set(items[i].bsgId, items[i]);
}

function getItemByID(id) {
  if (itemsByID.has(id)) {
    return itemsByID.get(id);
  }
  return null;
}