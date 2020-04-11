let actualData = {};

function calculateRotDirection(prevRot, rot) {
  const delta = rot - prevRot;
  if (delta > 180) return prevRot + 360;
  else if (delta < -180) return prevRot - 360;
  else return prevRot;
}

function updateObserverPosition(cid, position) {
  for (let i = 0; i < actualData.observers.length; ++i) {
    const obs = actualData.observers[i];
    if (obs.cid === cid) {
      obs.posUpdateTime = Date.now(); 
      if (obs.currentPos) obs.prevPos = obs.currentPos;
      else obs.prevPos = position;
      obs.pos = position;
    }
  }
}

function updateObserverRotation(cid, rotation) {
  for (let i = 0; i < actualData.observers.length; ++i) {
    const obs = actualData.observers[i];
    if (obs.cid === cid) {
      obs.rotUpdateTime = Date.now();
      if (obs.currentRot) {
        obs.prevRot = glm.vec3(
          calculateRotDirection(obs.currentRot.x, rotation.x),
          calculateRotDirection(obs.currentRot.y, rotation.y),
          calculateRotDirection(obs.currentRot.z, rotation.z)
        );
      }
      else {
        obs.prevRot = obs.currentRot;
      }
      
      obs.rot = rotation;
    }
  }
}

function observerDead(cid) {
  for (let i = 0; i < actualData.observers.length; ++i) {
    const obs = actualData.observers[i];
    if (obs.cid === cid) {
      obs.dead = true;
    }
  }
}

function observerUnspawn(cid) {
  for (let i = 0; i < actualData.observers.length; ++i) {
    const obs = actualData.observers[i];
    if (obs.cid === cid) {
      obs.unspawned = true;
    }
  }
}

function localPlayerUpdatePosition(position) {
  actualData.localPlayer.posUpdateTime = Date.now();
  if(actualData.localPlayer.currentPos) actualData.localPlayer.prevPos = actualData.localPlayer.currentPos;
  else actualData.localPlayer.prevPos = position;
  actualData.localPlayer.pos = position;
}

function localPlayerUpdateRot(rotation) {
  actualData.localPlayer.rotUpdateTime = Date.now(); 
  if (actualData.localPlayer.currentRot) {
    actualData.localPlayer.prevRot = glm.vec3(
      calculateRotDirection(actualData.localPlayer.currentRot.x, rotation.x),
      calculateRotDirection(actualData.localPlayer.currentRot.y, rotation.y),
      calculateRotDirection(actualData.localPlayer.currentRot.z, rotation.z)
    );
  }
  else {
    actualData.localPlayer.prevRot = rotation;
  }
  
  actualData.localPlayer.rot = rotation;
}

function spawnLocalPlayer(playerData) {
  actualData.localPlayer = playerData;
}

function observerSpawn(observerData) {
  let obsExists = false;
  for (let i = 0; i < actualData.observers.length; ++i) {
    const obs = actualData.observers[i];
    if (obs.cid === observerData.cid) {
      obsExists = true;
      break;
    }
  }

  if (obsExists)
    return;

  actualData.observers.push(observerData);
}

function addLoot(itemData) {
  let lootExists = false;
  for (let i = 0; i < actualData.loot.length; ++i) {
    const lootPlace = actualData.loot[i];
    if (lootPlace.item.id === itemData.item.id) {
      lootExists = true;
      break;
    }
  }

  if (lootExists)
    return;

  actualData.loot.push(itemData);
}

function registerChange(change) {
  switch(change.changeType) {
    case 'observerUpdatePosition': {
      updateObserverPosition(change.changeData.cid, change.changeData.pos);
      break;
    }
    case 'localPlayerSpawn': {
      spawnLocalPlayer(change.changeData);
      break;
    }
    case 'observerSpawn': {
      observerSpawn(change.changeData);
      break;
    }
    case 'localPlayerUpdatePosition': {
      localPlayerUpdatePosition(change.changeData.pos);
      break;
    }
    case 'localPlayerUpdateRotation': {
      localPlayerUpdateRot(change.changeData.rot);
      break;
    }
    case 'observerUpdateRotation': {
      updateObserverRotation(change.changeData.cid, change.changeData.rot);
      break;
    }
    case 'observerDead': {
      observerDead(change.changeData.cid);
      break;
    }
    case 'observerUnspawn': {
      observerUnspawn(change.changeData.cid);
      break;
    }
    case 'tempLootSync': {

      break;
    }
    case 'addLoot': {
      addLoot(change.changeData);
      break;
    }
    default: {
      console.log(change.changeType);
      break;
    }
  }
}

function registerChanges(changes) {
  for (let i = 0; i < changes.length; ++i) {
    registerChange(changes[i]);
  }
}

let lastPacketTime = null;

let ip = '127.0.0.1';

if (window.location.href.indexOf('#') != -1) {
  ip = window.location.href.split('#')[1];
}

const ws = new WebSocket(`ws://${ip}:3000`);
ws.onmessage = (e) => {
  const now = Date.now();
  if (lastPacketTime === null) {
    lastPacketTime = now;
  }
  else {
    window.interpolationTime = (now - lastPacketTime);
    lastPacketTime = now;
  }
  
  const data = JSON.parse(e.data);
  if (data.changes === undefined) {
    actualData = data;
    console.log('Inited');
  } else {
    registerChanges(data.changes);
  }
};

