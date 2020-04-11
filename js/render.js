const canvas = document.getElementById('cnv');
const ctx = canvas.getContext('2d');

const observedColor = glm.vec4(155, 255, 255, 255);
const npcColor = glm.vec4(255, 125, 255, 255);
const scavColor = glm.vec4(255, 255, 125, 255);
const friendColor = glm.vec4(125, 255, 125, 255);
const deadColor = glm.vec4(125, 125, 125, 255);
const lootColor = glm.vec4(255, 125, 125, 255);
const rareLootColor = glm.vec4(255, 0, 0, 255);
const tempLootColor = glm.vec4(255, 255, 255, 255);

let width = 0;
let height = 0;
window.interpolationTime = 25;

let useLerp = true;
let mapMode = true;
let blackBackground = true;
let drawIcons = true;
let bigIcons = false;
let lowerLootBorder = 40000;
let menuVisible = false;
let rotateMap = true;
let zoom = 1.5;

function saveConfig() {
  window.localStorage.setItem('config', JSON.stringify({
    mapMode,
    blackBackground,
    drawIcons,
    bigIcons,
    lowerLootBorder,
    menuVisible,
    rotateMap,
    zoom
  }));
}

function loadConfig() {
  let data = window.localStorage.getItem('config');
  if (data) {
    const obj = JSON.parse(data);
    mapMode = obj.mapMode;
    blackBackground = obj.blackBackground;
    drawIcons = obj.drawIcons;
    bigIcons = obj.bigIcons;
    lowerLootBorder = obj.lowerLootBorder;
    menuVisible = obj.menuVisible;
    rotateMap = obj.rotateMap;
    zoom = obj.zoom || 1.5;
    console.log(zoom);

    document.querySelector('#changeBackground').innerHTML = blackBackground ? 'Black' : 'White';
    document.querySelector('#changeModeButton').innerHTML = mapMode ? 'Radar' : 'Overlay';
    document.querySelector('#drawIcons').innerHTML = drawIcons ? 'Yes' : 'No';
    document.querySelector('#bigIcons').innerHTML = bigIcons ? 'Yes' : 'No';
    document.querySelector('#rotateMap').innerHTML = rotateMap ? 'Yes' : 'No';
    document.querySelector('#lootPrice').value = lowerLootBorder;
    document.querySelector('#menuSwitcher').innerHTML = menuVisible ? 'Hide' : 'Show';
    document.querySelector('#cheatButtons').style.display = menuVisible ? 'block' : 'none';
  }
}
loadConfig();

document.querySelector('#menuSwitcher').addEventListener('click', () => {
  menuVisible = !menuVisible;
  document.querySelector('#menuSwitcher').innerHTML = menuVisible ? 'Hide' : 'Show';
  document.querySelector('#cheatButtons').style.display = menuVisible ? 'block' : 'none';
  saveConfig();
});

document.querySelector('#changeBackground').addEventListener('click', () => {
  blackBackground = !blackBackground;
  document.querySelector('#changeBackground').innerHTML = blackBackground ? 'Black' : 'White';
  saveConfig();
});

document.querySelector('#changeModeButton').addEventListener('click', () => {
  mapMode = !mapMode;
  document.querySelector('#changeModeButton').innerHTML = mapMode ? 'Radar' : 'Overlay';
  saveConfig();
});

document.querySelector('#drawIcons').addEventListener('click', () => {
  drawIcons = !drawIcons;
  document.querySelector('#drawIcons').innerHTML = drawIcons ? 'Yes' : 'No';
  saveConfig();
});

document.querySelector('#bigIcons').addEventListener('click', () => {
  bigIcons = !bigIcons;
  document.querySelector('#bigIcons').innerHTML = bigIcons ? 'Yes' : 'No';
  saveConfig();
});

document.querySelector('#rotateMap').addEventListener('click', () => {
  rotateMap = !rotateMap;
  document.querySelector('#rotateMap').innerHTML = rotateMap ? 'Yes' : 'No';
  saveConfig();
});

document.querySelector('#lootPrice').addEventListener('change', () => {
  const value = parseInt(document.querySelector('#lootPrice').value);
  if (!Number.isNaN(value)) {
    lowerLootBorder = value;
    saveConfig();
  }
});

document.querySelector('#zoomPlus').addEventListener('click', () => {
  if (zoom < 5) {
    zoom += 0.2;
  }
});

document.querySelector('#zoomMinus').addEventListener('click', () => {
  if (zoom > 0.3) {
    zoom -= 0.2;
  }
});

function Rectangle(x, y, width, height, color) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.strokeRect(x, y, width, height);
}

function FilledRectangle(x, y, width, height, color) {
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.fillRect(x, y, width, height);
}

function Line(x, y, x2, y2, color, lineWidth = 1) {
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function DrawText(text, x, y, fontSize, color) {
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function lerp(a, b, n) {
  if (n > 1) n = 1;
  return a + (b - a) * n;
}


function renderMap() {
  const screenSize = glm.vec2(width, height);

  if (actualData.localPlayer) {
    const player = actualData.localPlayer;

    if (player.rotUpdateTime !== undefined && useLerp) {
      const timeFromLastUpdate = Date.now() - player.rotUpdateTime;
      const progress = timeFromLastUpdate / interpolationTime;
      player.currentRot = glm.vec3(
        lerp(player.prevRot.x, player.rot.x, progress),
        lerp(player.prevRot.y, player.rot.y, progress),
        lerp(player.prevRot.z, player.rot.z, progress)
      );
    }
    else {
      player.currentRot = player.rot;
    }
    const yaw = player.currentRot.x;

    if (player.posUpdateTime !== undefined && useLerp) {
      const timeFromLastUpdate = Date.now() - player.posUpdateTime;
      const progress = timeFromLastUpdate / interpolationTime;
      player.currentPos = glm.vec3(
        lerp(player.prevPos.x, player.pos.x, progress),
        lerp(player.prevPos.y, player.pos.y, progress),
        lerp(player.prevPos.z, player.pos.z, progress)
      );
    }
    else {
      player.currentPos = glm.vec3(player.pos.x, player.pos.y, player.pos.z);
    }
    const playerPos = player.currentPos;

    const sightLength = 50 * zoom;

    if (!rotateMap) {
      const playerSightX = Math.cos((yaw - 90) / 180 * Math.PI) * sightLength * 2;
      const playerSightY = Math.sin((yaw - 90) / 180 * Math.PI) * sightLength * 2;
      Line(screenSize.x / 2, screenSize.y / 2, screenSize.x / 2 + playerSightX, screenSize.y / 2 + playerSightY, {r: 0, g: 255, b: 0, a: 255});
      Line(screenSize.x / 2, screenSize.y / 2 - 15, screenSize.x / 2, screenSize.y / 2 + 15, {r: 0, g: 255, b: 0, a: 255});
      Line(screenSize.x / 2 - 15, screenSize.y / 2, screenSize.x / 2 + 15, screenSize.y / 2, {r: 0, g: 255, b: 0, a: 255});
    }
    else {
      Line(screenSize.x / 2, 0, screenSize.x / 2, screenSize.y / 2 + 15, {r: 0, g: 255, b: 0, a: 255});
      Line(screenSize.x / 2 - 15, screenSize.y / 2, screenSize.x / 2 + 15, screenSize.y / 2, {r: 0, g: 255, b: 0, a: 255});
    }


    let boxSize = glm.vec2(5, 5)['*'](zoom);

    for (let i = 0; i < actualData.observers.length; ++i) {
      const obs = actualData.observers[i];
      if (obs.unspawned)
        continue;

      let color = observedColor;
      if (obs.profile.Info.Side != "Bear" && obs.profile.Info.Side != "Usec")
      {
        if (obs.profile.Info.RegistrationDate == 0) color = npcColor;
        else color = scavColor;
      }

      if (obs.posUpdateTime !== undefined && useLerp) {
        const timeFromLastUpdate = Date.now() - obs.posUpdateTime;
        const progress = timeFromLastUpdate / interpolationTime;
        obs.currentPos = glm.vec3(
          lerp(obs.prevPos.x, obs.pos.x, progress),
          lerp(obs.prevPos.y, obs.pos.y, progress),
          lerp(obs.prevPos.z, obs.pos.z, progress)
        );
      }
      else {
        obs.currentPos = glm.vec3(obs.pos.x, obs.pos.y, obs.pos.z);
      }
      const obsPos = obs.currentPos;

      if (obs.rotUpdateTime !== undefined && obs.prevRot !== undefined && useLerp) {
        const timeFromLastUpdate = Date.now() - obs.rotUpdateTime;
        const progress = timeFromLastUpdate / interpolationTime;
        obs.currentRot = glm.vec3(
          lerp(obs.prevRot.x, obs.rot.x, progress),
          lerp(obs.prevRot.y, obs.rot.y, progress),
          lerp(obs.prevRot.z, obs.rot.z, progress)
        );
      }
      else {
        obs.currentRot = obs.rot;
        obs.prevRot = obs.rot;
      }

      const { isOnScreen, screenPos } = ToMap(obsPos, playerPos, rotateMap ? yaw : 0, screenSize, zoom);

      if (obs.dead) {
        color = deadColor;
      }
      else {
        const dist = glm.length(obsPos['-'](playerPos));
        DrawText(`${dist.toFixed(0)}m`, screenPos.x, screenPos.y - boxSize.y/2 - 5, 15, color);

        const obsYaw = obs.currentRot.x;
        const sightX = Math.cos((obsYaw - 90 - (rotateMap ? yaw : 0)) / 180 * Math.PI) * sightLength;
        const sightY = Math.sin((obsYaw - 90 - (rotateMap ? yaw : 0)) / 180 * Math.PI) * sightLength;
        Line(screenPos.x, screenPos.y, screenPos.x + sightX, screenPos.y + sightY, color);
      }


      if (isOnScreen) {
        const heightDiff = Math.abs(playerPos.y - obsPos.y);

        if (heightDiff > 0.6) {
          if (playerPos.y > obsPos.y) {
            //Lower
            Line(screenPos.x, screenPos.y - boxSize.y / 2, screenPos.x, screenPos.y + boxSize.y/2, color, 1);
            Line(screenPos.x - boxSize.x / 3, screenPos.y, screenPos.x, screenPos.y + boxSize.y/2, color, 1);
            Line(screenPos.x + boxSize.x / 3, screenPos.y, screenPos.x, screenPos.y + boxSize.y/2, color, 1);
          } else {
            //Higher
            Line(screenPos.x, screenPos.y - boxSize.y / 2, screenPos.x, screenPos.y + boxSize.y/2, color, 1);
            Line(screenPos.x - boxSize.x / 3, screenPos.y, screenPos.x, screenPos.y - boxSize.y/2, color, 1);
            Line(screenPos.x + boxSize.x / 3, screenPos.y, screenPos.x, screenPos.y - boxSize.y/2, color, 1);
          }
        } else {
          Rectangle(screenPos.x - boxSize.x/2, screenPos.y - boxSize.y/2, boxSize.x, boxSize.y, color);
        }
      }
    }

    for (let i = 0; i < actualData.loot.length; ++i) {
      const lootItem = actualData.loot[i];
      let itemInfo = getItemByID(lootItem.item.templateId);
      if (itemInfo) {
        const maxPrice = Math.max(itemInfo.price || 0, itemInfo.traderPrice || 0);

        if (maxPrice > lowerLootBorder) {
          const itemPos = glm.vec3(lootItem.pos.x, lootItem.pos.y, lootItem.pos.z);
          const { isOnScreen, screenPos } = ToMap(itemPos, playerPos, rotateMap ? yaw : 0, screenSize, zoom);
          if (isOnScreen) {
            const color = lootColor;
            if (drawIcons === true) {
              const img = GetImage(lootItem.item.templateId, 32, 32);
              if (img !== true) {
                if (bigIcons === true) {
                  ctx.drawImage(img, screenPos.x - 32, screenPos.y - 32, 64, 64);
                }
                else
                {
                  FilledRectangle(screenPos.x - boxSize.x/2, screenPos.y - boxSize.y/2, boxSize.x, boxSize.y, glm.vec4(255, 255, 255, 255));
                  ctx.drawImage(img, screenPos.x - boxSize.x/2, screenPos.y - boxSize.y/2, boxSize.x, boxSize.y);
                }
              }
            }

            if (!drawIcons) {
              DrawText(`${itemInfo.shortName}\n${(maxPrice/1000).toFixed(0)}k`, screenPos.x, screenPos.y - boxSize.y/2 - 5, 15, color);
            }
            color.a = 50;
            const heightDiff = Math.abs(playerPos.y - lootItem.pos.y);
            if (heightDiff > 0.6) {
              if (playerPos.y > lootItem.pos.y) {
                //Lower
                Line(screenPos.x, screenPos.y - boxSize.y / 2, screenPos.x, screenPos.y + boxSize.y/2, color, 0.5);
                Line(screenPos.x - boxSize.x / 3, screenPos.y, screenPos.x, screenPos.y + boxSize.y/2, color, 0.5);
                Line(screenPos.x + boxSize.x / 3, screenPos.y, screenPos.x, screenPos.y + boxSize.y/2, color, 0.5);
              } else {
                //Higher
                Line(screenPos.x, screenPos.y - boxSize.y / 2, screenPos.x, screenPos.y + boxSize.y/2, color, 0.5);
                Line(screenPos.x - boxSize.x / 3, screenPos.y, screenPos.x, screenPos.y - boxSize.y/2, color, 0.5);
                Line(screenPos.x + boxSize.x / 3, screenPos.y, screenPos.x, screenPos.y - boxSize.y/2, color, 0.5);
              }
            } else if(!drawIcons) {
              Rectangle(screenPos.x - boxSize.x/2, screenPos.y - boxSize.y/2, boxSize.x, boxSize.y, color);
            }
          }
        }
      }
    }
  }
}

function renderOverlay() {
  let view = glm.mat4(1.0);
  let projection = glm.mat4(1.0);

  projection = glm.perspective(glm.radians(75.0), width / height, 0.1, 2000);
  projection = glm.scale(projection, glm.vec3(-1.0, 1.0, 1.0));

  const screenSize = glm.vec2(width, height);
  
  if (actualData.localPlayer) {
    const player = actualData.localPlayer;
    
    if (player.rotUpdateTime !== undefined && useLerp) {
      const timeFromLastUpdate = Date.now() - player.rotUpdateTime;
      const progress = timeFromLastUpdate / interpolationTime;
      player.currentRot = glm.vec3(
        lerp(player.prevRot.x, player.rot.x, progress),
        lerp(player.prevRot.y, player.rot.y, progress),
        lerp(player.prevRot.z, player.rot.z, progress)
      );
    }
    else {
      player.currentRot = player.rot;
    }

    const pitch = player.currentRot.y;
    const yaw = player.currentRot.x;

    Line(screenSize.x / 2, screenSize.y / 2 - 15, screenSize.x / 2, screenSize.y / 2 + 15, {r: 0, g: 255, b: 0, a: 255});
    Line(screenSize.x / 2 - 15, screenSize.y / 2, screenSize.x / 2 + 15, screenSize.y / 2, {r: 0, g: 255, b: 0, a: 255});

    if (player.posUpdateTime !== undefined && useLerp) {
      const timeFromLastUpdate = Date.now() - player.posUpdateTime;
      const progress = timeFromLastUpdate / interpolationTime;
      player.currentPos = glm.vec3(
        lerp(player.prevPos.x, player.pos.x, progress),
        lerp(player.prevPos.y, player.pos.y, progress),
        lerp(player.prevPos.z, player.pos.z, progress)
      );
    }
    else {
      player.currentPos = glm.vec3(player.pos.x, player.pos.y, player.pos.z);
    }
    const playerPos = player.currentPos;

    const camAt = glm.vec3(player.pos.x, player.pos.y + 1.5, player.pos.z);
    const playerForwardVec = GetForwardVec(pitch, yaw, camAt);
    const camLook = camAt['+'](playerForwardVec);
    view = glm.lookAt(camAt, camLook, glm.vec3(0.0, 1.0, 0.0));

    for (let i = 0; i < actualData.observers.length; ++i) {
      const obs = actualData.observers[i];
      if (obs.unspawned)
        continue;

      if (obs.posUpdateTime !== undefined && useLerp) {
        const timeFromLastUpdate = Date.now() - obs.posUpdateTime;
        const progress = timeFromLastUpdate / interpolationTime;
        obs.currentPos = glm.vec3(
          lerp(obs.prevPos.x, obs.pos.x, progress),
          lerp(obs.prevPos.y, obs.pos.y, progress),
          lerp(obs.prevPos.z, obs.pos.z, progress)
        );
      }
      else {
        obs.currentPos = glm.vec3(obs.pos.x, obs.pos.y, obs.pos.z);
      }
      const obsPos = obs.currentPos;

      if (obs.rotUpdateTime !== undefined && useLerp) {
        const timeFromLastUpdate = Date.now() - obs.rotUpdateTime;
        const progress = timeFromLastUpdate / interpolationTime;
        obs.currentRot = glm.vec3(
          lerp(obs.prevRot.x, obs.rot.x, progress),
          lerp(obs.prevRot.y, obs.rot.y, progress),
          lerp(obs.prevRot.z, obs.rot.z, progress)
        );
      }
      else {
        obs.currentRot = obs.rot;
      }

      let color = observedColor;
      if (obs.profile && obs.profile.Info.Side != "Bear" && obs.profile.Info.Side != "Usec")
      {
        if (obs.profile.Info.RegistrationDate == 0) color = npcColor;
        else color = scavColor;
      }

      const dist = glm.length(obsPos['-'](playerPos));
      if (dist < 200) {
        const { isOnScreen, onScreenPos } = WorldToScreen(obsPos, view, projection, screenSize);
        if (isOnScreen) {
          let fontSize = 16;
          let boxSize = glm.vec2(13, 25);
          if (dist < 100) {
            const multiplier = (100 - dist) / 100;
            fontSize += (8 * multiplier);
            boxSize.x += 25 * multiplier;
            boxSize.y += 50 * multiplier;
          }

          if (obs.dead) {
            color = deadColor;
            boxSize = glm.vec2(boxSize.y, boxSize.x);
          }

          DrawText(`(${dist.toFixed(0)}m)`, onScreenPos.x, onScreenPos.y - boxSize.y/2 - fontSize / 2 - 4, fontSize, color);
          Rectangle(onScreenPos.x - boxSize.x/2, onScreenPos.y - boxSize.y/2, boxSize.x, boxSize.y, color);
        }
      }
    }
  }
}

function render() {
  ctx.clearRect(0, 0, width, height);
  if (blackBackground) {
    ctx.fillStyle = blackBackground === true ? "#000" : "#FFF";  // Specify black as the fill color.
    ctx.fillRect(0, 0, width, height);  // Create a filled rectangle.
  }
  
  if(mapMode === true) 
    renderMap();
  else 
    renderOverlay();
  window.requestAnimationFrame(render);
}

window.addEventListener('load', () => {
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  width = canvas.width;
  height = canvas.height;

  window.requestAnimationFrame(render);
});

window.addEventListener('resize', () => {
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  width = canvas.width;
  height = canvas.height;
});

window.addEventListener('wheel', (e) => {
  if (e.deltaY < 0) {
    if (zoom < 5) {
      zoom += 0.2;
    }
  } else if (e.deltaY > 0) {
    if (zoom > 0.3) {
      zoom -= 0.2;
    }
  }
});
